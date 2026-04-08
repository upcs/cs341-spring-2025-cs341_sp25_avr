type SessionResponse = {
  authenticated: boolean;
  email?: string | null;
  name?: string | null;
};

type AuthResponse = {
  ok: boolean;
  email?: string;
  name?: string;
  message?: string;
  verificationUrl?: string | null;
  resetUrl?: string | null;
};

type LocalUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  verified: boolean;
  verificationToken: string | null;
  resetToken: string | null;
};

const AUTH_STORAGE_VERSION = "2026-04-07-reset";
const VERSION_KEY = "avr_local_auth_version";
const USERS_KEY = `avr_local_users:${AUTH_STORAGE_VERSION}`;
const SESSION_KEY = `avr_local_session:${AUTH_STORAGE_VERSION}`;
const LEGACY_AUTH_KEYS = [
  "avr_local_users",
  "avr_local_session",
];

class BackendUnavailableError extends Error {}

function clearLegacyLocalAuthStorage() {
  try {
    const currentVersion = window.localStorage.getItem(VERSION_KEY);
    if (currentVersion === AUTH_STORAGE_VERSION) {
      return;
    }

    for (const key of LEGACY_AUTH_KEYS) {
      window.localStorage.removeItem(key);
    }

    for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
      const key = window.localStorage.key(index);
      if (key?.startsWith("avr_local_users:") || key?.startsWith("avr_local_session:")) {
        window.localStorage.removeItem(key);
      }
    }

    window.localStorage.setItem(VERSION_KEY, AUTH_STORAGE_VERSION);
  } catch {
    // Ignore storage access errors and fall back to empty in-memory behavior.
  }
}

clearLegacyLocalAuthStorage();

function normalizeFrontendUrl(urlValue: string | null | undefined) {
  if (!urlValue) return null;

  try {
    const parsed = new URL(urlValue, window.location.origin);
    parsed.protocol = window.location.protocol;
    parsed.host = window.location.host;
    return parsed.toString();
  } catch {
    return urlValue;
  }
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function validUpEmail(email: string) {
  return /^[a-z0-9._%+-]+@up\.edu$/i.test(normalizeEmail(email));
}

function readUsers(): LocalUser[] {
  try {
    const raw = window.localStorage.getItem(USERS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeUsers(users: LocalUser[]) {
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getSessionUser() {
  const email = window.localStorage.getItem(SESSION_KEY);
  if (!email) return null;
  return readUsers().find((user) => user.email === email) || null;
}

function setSession(email: string | null) {
  if (!email) {
    window.localStorage.removeItem(SESSION_KEY);
    return;
  }
  window.localStorage.setItem(SESSION_KEY, email);
}

async function requestJson(path: string, init?: RequestInit) {
  let response: Response;
  try {
    response = await fetch(path, {
      credentials: "include",
      ...init,
    });
  } catch {
    markBackendUnavailable();
    throw new BackendUnavailableError("Auth API unavailable");
  }

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await response.json().catch(() => ({})) : {};

  if (!isJson || response.status === 404) {
    markBackendUnavailable();
    throw new BackendUnavailableError("Auth API unavailable");
  }

  clearBackendUnavailable();

  if (!response.ok) {
    throw new Error(data.message || "Authentication failed");
  }
  return {
    ...data,
    verificationUrl: normalizeFrontendUrl(data.verificationUrl),
    resetUrl: normalizeFrontendUrl(data.resetUrl),
  };
}

function buildLocalVerificationUrl(token: string) {
  const url = new URL(window.location.href);
  url.searchParams.set("verify", token);
  return url.toString();
}

async function fallbackGetSession(): Promise<SessionResponse> {
  const user = getSessionUser();
  return {
    authenticated: Boolean(user),
    email: user?.email || null,
    name: user?.name || null,
  };
}

async function fallbackSignup(payload: { name: string; email: string; password: string }): Promise<AuthResponse> {
  const email = normalizeEmail(payload.email);
  if (!payload.name.trim()) {
    throw new Error("Name is required");
  }
  if (!validUpEmail(email)) {
    throw new Error("Only University of Portland emails (@up.edu) are allowed.");
  }
  if (payload.password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  const users = readUsers();
  if (users.some((user) => user.email === email)) {
    throw new Error("An account with that email already exists");
  }

  const verificationToken = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  users.push({
    id: crypto.randomUUID(),
    name: payload.name.trim(),
    email,
    password: payload.password,
    verified: false,
    verificationToken,
    resetToken: null,
  });
  writeUsers(users);

  return {
    ok: true,
    email,
    name: payload.name.trim(),
    message: "Check your @up.edu email for the verification link before signing in.",
    verificationUrl: buildLocalVerificationUrl(verificationToken),
  };
}

async function fallbackVerify(token: string): Promise<AuthResponse> {
  const users = readUsers();
  const user = users.find((entry) => entry.verificationToken === token);
  if (!user) {
    throw new Error("Invalid verification link");
  }
  user.verified = true;
  user.verificationToken = null;
  writeUsers(users);
  return {
    ok: true,
    email: user.email,
    name: user.name,
    message: "Email verified. You can now sign in.",
  };
}

async function fallbackForgotPassword(emailInput: string): Promise<AuthResponse> {
  const email = normalizeEmail(emailInput);
  const users = readUsers();
  const user = users.find((entry) => entry.email === email) || null;

  if (user) {
    user.resetToken = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    writeUsers(users);
  }

  return {
    ok: true,
    message: "If that @up.edu account exists, a password reset link is ready.",
    resetUrl: user ? buildLocalResetUrl(user.resetToken as string) : null,
  };
}

function buildLocalResetUrl(token: string) {
  const url = new URL(window.location.href);
  url.searchParams.set("reset", token);
  return url.toString();
}

async function fallbackResetPassword(token: string, password: string): Promise<AuthResponse> {
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  const users = readUsers();
  const user = users.find((entry) => entry.resetToken === token);
  if (!user) {
    throw new Error("Invalid password reset link");
  }

  user.password = password;
  user.resetToken = null;
  writeUsers(users);

  return {
    ok: true,
    email: user.email,
    name: user.name,
    message: "Password reset. You can now sign in.",
  };
}

async function fallbackLogin(payload: { email: string; password: string }): Promise<AuthResponse> {
  const email = normalizeEmail(payload.email);
  const user = readUsers().find((entry) => entry.email === email);
  if (!user) {
    throw new Error("No account exists for that @up.edu email. Sign up first or check the address.");
  }
  if (user.password !== payload.password) {
    throw new Error("Incorrect password. Try again or use the same password you created during sign up.");
  }
  if (!user.verified) {
    throw new Error("Your account is not verified yet. Open the verification link first, then sign in.");
  }
  setSession(user.email);
  return {
    ok: true,
    email: user.email,
    name: user.name,
  };
}

async function fallbackLogout(): Promise<void> {
  setSession(null);
}

export async function getSession(): Promise<SessionResponse> {
  try {
    return await requestJson("/api/auth/session");
  } catch {
    return fallbackGetSession();
  }
}

export async function signup(payload: { name: string; email: string; password: string }): Promise<AuthResponse> {
  try {
    return await requestJson("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    if (error instanceof TypeError || error instanceof BackendUnavailableError) {
      return fallbackSignup(payload);
    }
    throw error;
  }
}

export async function verifyEmail(token: string): Promise<AuthResponse> {
  try {
    return await requestJson("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
  } catch (error) {
    if (error instanceof TypeError || error instanceof BackendUnavailableError) {
      return fallbackVerify(token);
    }
    throw error;
  }
}

export async function login(payload: { email: string; password: string }): Promise<AuthResponse> {
  try {
    return await requestJson("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    if (error instanceof TypeError || error instanceof BackendUnavailableError) {
      return fallbackLogin(payload);
    }
    throw error;
  }
}

export async function forgotPassword(email: string): Promise<AuthResponse> {
  try {
    return await requestJson("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
  } catch (error) {
    if (error instanceof TypeError || error instanceof BackendUnavailableError) {
      return fallbackForgotPassword(email);
    }
    throw error;
  }
}

export async function resendVerification(email: string): Promise<AuthResponse> {
  try {
    return await requestJson("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
  } catch (error) {
    if (error instanceof TypeError || error instanceof BackendUnavailableError) {
      const user = readUsers().find((entry) => entry.email === normalizeEmail(email));
      if (!user) {
        throw new Error("No account exists for that @up.edu email. Sign up first or check the address.");
      }

      user.verificationToken = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      writeUsers(readUsers().map((entry) => (entry.email === user.email ? user : entry)));

      return {
        ok: true,
        email: user.email,
        name: user.name,
        message: "A fresh verification link is ready for this account.",
        verificationUrl: buildLocalVerificationUrl(user.verificationToken),
      };
    }
    throw error;
  }
}

export async function resetPassword(token: string, password: string): Promise<AuthResponse> {
  try {
    return await requestJson("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
  } catch (error) {
    if (error instanceof TypeError || error instanceof BackendUnavailableError) {
      return fallbackResetPassword(token, password);
    }
    throw error;
  }
}

export async function logout(): Promise<void> {
  try {
    await requestJson("/api/auth/logout", {
      method: "POST",
    });
  } catch (error) {
    if (error instanceof TypeError || error instanceof BackendUnavailableError) {
      await fallbackLogout();
      return;
    }
    throw error;
  }
}
import { clearBackendUnavailable, markBackendUnavailable } from "./backend-status";
