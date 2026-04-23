import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();
global.fetch = fetchMock as unknown as typeof fetch;

const LEGACY_VERSION_KEY = "avr_local_auth_version";

async function loadAuthModules() {
  vi.resetModules();
  const auth = await import("@/lib/auth-client");
  const backend = await import("@/lib/backend-status");
  return { ...auth, ...backend };
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("auth-client", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    window.localStorage.clear();
    window.history.replaceState({}, "", "http://localhost:3000/");
  });

  it("clears legacy local auth keys on import", async () => {
    window.localStorage.setItem("avr_local_users", "legacy-users");
    window.localStorage.setItem("avr_local_session", "legacy-session");
    window.localStorage.setItem("avr_local_users:old", "stale-users");
    window.localStorage.setItem("avr_local_session:old", "stale-session");
    window.localStorage.setItem(LEGACY_VERSION_KEY, "stale-version");

    await loadAuthModules();

    expect(window.localStorage.getItem("avr_local_users")).toBeNull();
    expect(window.localStorage.getItem("avr_local_session")).toBeNull();
    expect(window.localStorage.getItem("avr_local_users:old")).toBeNull();
    expect(window.localStorage.getItem("avr_local_session:old")).toBeNull();
    expect(window.localStorage.getItem(LEGACY_VERSION_KEY)).not.toBe("stale-version");
  });

  it("uses the backend session when the API responds and clears the backend unavailable flag", async () => {
    const { getSession, isBackendUnavailable } = await loadAuthModules();

    fetchMock.mockRejectedValueOnce(new TypeError("offline"));
    expect(await getSession()).toEqual({
      authenticated: false,
      email: null,
      name: null,
      role: "member",
    });
    expect(isBackendUnavailable()).toBe(true);

    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        authenticated: true,
        email: "user@up.edu",
        name: "Campus User",
        role: "admin",
      })
    );

    await expect(getSession()).resolves.toMatchObject({
      authenticated: true,
      email: "user@up.edu",
      name: "Campus User",
      role: "admin",
    });
    expect(isBackendUnavailable()).toBe(false);
  });

  it("normalizes backend verification links onto the frontend origin", async () => {
    const { signup } = await loadAuthModules();

    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        ok: true,
        email: "user@up.edu",
        name: "Campus User",
        verificationUrl: "https://api.example.com/verify?token=abc123",
      }, 201)
    );

    await expect(
      signup({
        name: "Campus User",
        email: "user@up.edu",
        password: "campuspass",
      })
    ).resolves.toMatchObject({
      ok: true,
      verificationUrl: "http://localhost:3000/verify?token=abc123",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/signup",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      })
    );
  });

  it("supports the full local signup, verification, login, reset, and logout flow", async () => {
    const {
      forgotPassword,
      getSession,
      login,
      logout,
      resetPassword,
      signup,
      verifyEmail,
    } = await loadAuthModules();

    fetchMock.mockRejectedValue(new TypeError("offline"));

    const signupResult = await signup({
      name: " Test User ",
      email: "USER@UP.EDU",
      password: "password1",
    });

    expect(signupResult).toMatchObject({
      ok: true,
      email: "user@up.edu",
      name: "Test User",
      role: "member",
    });

    const localAuthStorage = Array.from({ length: window.localStorage.length }, (_value, index) => {
      const key = window.localStorage.key(index) || "";
      return `${key}:${window.localStorage.getItem(key) || ""}`;
    }).join("\n");
    expect(localAuthStorage).not.toContain("password1");
    expect(localAuthStorage).toContain("pbkdf2-sha256:120000");

    await expect(
      login({
        email: "user@up.edu",
        password: "password1",
      })
    ).rejects.toThrow(/not verified/i);

    const verificationToken = new URL(signupResult.verificationUrl as string).searchParams.get("verify");
    expect(verificationToken).toBeTruthy();

    await expect(verifyEmail(verificationToken as string)).resolves.toMatchObject({
      ok: true,
      email: "user@up.edu",
    });

    await expect(
      login({
        email: "USER@UP.EDU",
        password: "password1",
      })
    ).resolves.toMatchObject({
      ok: true,
      email: "user@up.edu",
      name: "Test User",
      role: "member",
    });

    await expect(getSession()).resolves.toEqual({
      authenticated: true,
      email: "user@up.edu",
      name: "Test User",
      role: "member",
    });

    const forgotResult = await forgotPassword("user@up.edu");
    const resetToken = new URL(forgotResult.resetUrl as string).searchParams.get("reset");
    expect(resetToken).toBeTruthy();

    await expect(resetPassword(resetToken as string, "newpass12")).resolves.toMatchObject({
      ok: true,
      email: "user@up.edu",
    });

    await logout();
    await expect(getSession()).resolves.toEqual({
      authenticated: false,
      email: null,
      name: null,
      role: "member",
    });

    await expect(
      login({
        email: "user@up.edu",
        password: "password1",
      })
    ).rejects.toThrow(/incorrect password/i);

    await expect(
      login({
        email: "user@up.edu",
        password: "newpass12",
      })
    ).resolves.toMatchObject({
      ok: true,
      email: "user@up.edu",
    });
  });

  it("refreshes verification links locally and rejects unknown accounts", async () => {
    const { resendVerification, signup } = await loadAuthModules();

    fetchMock.mockRejectedValue(new TypeError("offline"));

    const signupResult = await signup({
      name: "Campus User",
      email: "user@up.edu",
      password: "campuspass",
    });
    const originalVerificationUrl = signupResult.verificationUrl;

    await expect(resendVerification("missing@up.edu")).rejects.toThrow(/no account exists/i);

    const resent = await resendVerification("user@up.edu");
    expect(resent).toMatchObject({
      ok: true,
      email: "user@up.edu",
      name: "Campus User",
      role: "member",
    });
    expect(resent.verificationUrl).not.toBe(originalVerificationUrl);
  });

  it("falls back to local auth when the backend is unavailable and surfaces backend errors", async () => {
    const { forgotPassword, login, signup } = await loadAuthModules();

    fetchMock
      .mockResolvedValueOnce(new Response("missing", { status: 404, headers: { "Content-Type": "text/plain" } }))
      .mockResolvedValueOnce(
        jsonResponse(
          {
            message: "Wrong password",
          },
          401
        )
      );

    await expect(
      signup({
        name: "Campus User",
        email: "user@up.edu",
        password: "campuspass",
      })
    ).resolves.toMatchObject({
      ok: true,
      email: "user@up.edu",
    });

    await expect(
      login({
        email: "user@up.edu",
        password: "campuspass",
      })
    ).rejects.toThrow("Wrong password");

    fetchMock.mockResolvedValueOnce(new Response("offline", { status: 503, headers: { "Content-Type": "text/plain" } }));

    await expect(forgotPassword("user@up.edu")).resolves.toMatchObject({
      ok: true,
      message: expect.stringContaining("password reset link"),
    });
  });
});
