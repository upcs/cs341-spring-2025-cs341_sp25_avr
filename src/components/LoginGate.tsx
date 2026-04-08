import type { FormEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import { AuthProvider } from "./auth-context";
import { forgotPassword, getSession, login, logout, resendVerification, resetPassword, signup, verifyEmail } from "@/lib/auth-client";
import { isBackendUnavailable } from "@/lib/backend-status";

type AuthState = "loading" | "authenticated" | "guest" | "unauthenticated";
type AuthMode = "login" | "signup" | "forgot" | "reset";

interface SessionResponse {
  authenticated?: boolean;
  email?: string | null;
  name?: string | null;
}

interface LoginGateProps {
  children: ReactNode;
}

const emptyForm = {
  name: "",
  email: "",
  password: "",
};

const LoginGate = ({ children }: LoginGateProps) => {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [mode, setMode] = useState<AuthMode>("login");
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [verificationUrl, setVerificationUrl] = useState<string | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [displayName, setDisplayName] = useState<string>("");
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [offlineFallback, setOfflineFallback] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const verifyToken = new URLSearchParams(window.location.search).get("verify");
    const resetParam = new URLSearchParams(window.location.search).get("reset");

    if (resetParam) {
      setResetToken(resetParam);
      setMode("reset");
      window.history.replaceState({}, "", window.location.pathname);
    }

    if (verifyToken) {
      verifyEmail(verifyToken)
        .then((data) => {
          if (cancelled) return;
          setInfo(data.message || "Email verified. You can now sign in.");
          window.history.replaceState({}, "", window.location.pathname);
        })
        .catch((err) => {
          if (cancelled) return;
          setError(err instanceof Error ? err.message : "Verification failed");
          window.history.replaceState({}, "", window.location.pathname);
        });
    }

    getSession()
      .then((data: SessionResponse) => {
        if (cancelled) return;
        setDisplayName(data.name || data.email || "");
        setAuthState(data.authenticated ? "authenticated" : "unauthenticated");
        setOfflineFallback(isBackendUnavailable());
      })
      .catch(() => {
        if (cancelled) return;
        setAuthState("unauthenticated");
        setError("Unable to verify your session.");
        setOfflineFallback(isBackendUnavailable());
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const submitPath = mode === "signup" ? "/api/auth/signup" : "/api/auth/login";

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setInfo(null);
    setVerificationUrl(null);
    setResetUrl(null);
    setShowResendVerification(false);

    try {
      const data =
        mode === "signup"
          ? await signup(form)
          : mode === "forgot"
            ? await forgotPassword(form.email)
            : mode === "reset"
              ? await resetPassword(resetToken || "", form.password)
              : await login({ email: form.email, password: form.password });

      if (mode === "signup") {
        setForm(emptyForm);
        setMode("login");
        setInfo(data.message || "Check your email to verify your account.");
        setVerificationUrl(data.verificationUrl || null);
        setOfflineFallback(isBackendUnavailable());
        return;
      }

      if (mode === "forgot") {
        setInfo(data.message || "Password reset link ready.");
        setResetUrl(data.resetUrl || null);
        setOfflineFallback(isBackendUnavailable());
        return;
      }

      if (mode === "reset") {
        setInfo(data.message || "Password reset. You can now sign in.");
        setMode("login");
        setResetToken(null);
        setForm(emptyForm);
        setOfflineFallback(isBackendUnavailable());
        return;
      }

      setDisplayName(data.name || data.email || "");
      setAuthState("authenticated");
      setOfflineFallback(isBackendUnavailable());
    } catch (err) {
      const message = err instanceof Error ? err.message : "Authentication failed";
      setError(message);
      setShowResendVerification(message.toLowerCase().includes("not verified"));
      setOfflineFallback(isBackendUnavailable());
    } finally {
      setSubmitting(false);
    }
  };

  if (authState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="rounded-2xl border border-border bg-card px-6 py-5 text-sm text-muted-foreground shadow-sm">
          Checking session...
        </div>
      </div>
    );
  }

  if (authState === "authenticated") {
    return (
      <AuthProvider value={{ authenticated: true, readOnly: false, displayName }}>
        <div className="relative">
          <div className="fixed right-4 top-4 z-50 flex items-center gap-2 rounded-full border border-border bg-card/95 px-3 py-2 shadow-sm backdrop-blur">
            {displayName && <span className="text-xs font-medium text-foreground">{displayName}</span>}
            {offlineFallback && (
              <span className="rounded-full bg-muted px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Local Auth
              </span>
            )}
            <button
              type="button"
              onClick={async () => {
                await logout();
                setDisplayName("");
                setForm(emptyForm);
                setAuthState("unauthenticated");
                setMode("login");
              }}
              className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground"
            >
              Log Out
            </button>
          </div>
          {children}
        </div>
      </AuthProvider>
    );
  }

  if (authState === "guest") {
    return (
      <AuthProvider value={{ authenticated: false, readOnly: true, displayName: "Guest" }}>
        <div className="relative">
          <div className="fixed right-4 top-4 z-50 flex items-center gap-2 rounded-full border border-border bg-card/95 px-3 py-2 shadow-sm backdrop-blur">
            <span className="text-xs font-medium text-foreground">Guest view</span>
            <button
              type="button"
              onClick={() => setAuthState("unauthenticated")}
              className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground"
            >
              Sign In
            </button>
          </div>
          {children}
        </div>
      </AuthProvider>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-xl">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-2">Restricted Access</p>
          <h1 className="text-3xl font-bold text-foreground">
            {mode === "signup"
              ? "Create UP Account Access"
              : mode === "forgot"
                ? "Forgot Password"
                : mode === "reset"
                  ? "Reset Password"
                  : "Campus History Login"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signup"
              ? "Sign up with your @up.edu email to access the campus archive."
              : mode === "forgot"
                ? "Enter your @up.edu email to get a password reset link."
                : mode === "reset"
                  ? "Set a new password for your @up.edu account."
              : "Sign in with the @up.edu account you created for the campus archive."}
          </p>
          {offlineFallback && (
            <p className="mt-3 rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              Auth API unavailable. The app is using browser-local demo accounts for fallback access; backend auth remains the intended production mode.
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            setAuthState("guest");
            setError(null);
            setInfo(null);
          }}
          className="mb-5 w-full rounded-xl border border-border px-4 py-3 text-sm font-semibold text-foreground"
        >
          Continue as Guest
        </button>

        <div className="mb-5 grid grid-cols-2 rounded-xl bg-muted p-1">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError(null);
            }}
            className={`rounded-lg px-3 py-2 text-sm font-semibold ${mode === "login" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setError(null);
            }}
            className={`rounded-lg px-3 py-2 text-sm font-semibold ${mode === "signup" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
          >
            Sign Up
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {mode === "signup" && (
            <input
              type="text"
              placeholder="Full name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground"
            />
          )}
          {mode !== "reset" && (
            <input
              type="email"
              placeholder="name@up.edu"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground"
            />
          )}
          {mode !== "forgot" && (
            <input
              type="password"
              placeholder={mode === "reset" ? "New password" : "Password"}
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground"
            />
          )}
          {(mode === "signup" || mode === "reset") && (
            <p className="text-xs text-muted-foreground">Passwords must be at least 8 characters.</p>
          )}
          {info && <p className="text-sm text-emerald-600">{info}</p>}
          {verificationUrl && (
            <a
              href={verificationUrl}
              className="block text-sm font-medium text-primary underline underline-offset-4"
            >
              Open verification link
            </a>
          )}
          {showResendVerification && form.email.trim() && (
            <button
              type="button"
              onClick={async () => {
                try {
                  const data = await resendVerification(form.email);
                  setInfo(data.message || "A fresh verification link is ready.");
                  setVerificationUrl(data.verificationUrl || null);
                  setError(null);
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Unable to resend verification");
                }
              }}
              className="block text-sm font-medium text-primary underline underline-offset-4"
            >
              Get a new verification link
            </button>
          )}
          {resetUrl && (
            <a
              href={resetUrl}
              className="block text-sm font-medium text-primary underline underline-offset-4"
            >
              Open password reset link
            </a>
          )}
          {error && <p className="text-sm text-rose-500">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {submitting
              ? "Submitting..."
              : mode === "signup"
                ? "Create Account"
                : mode === "forgot"
                  ? "Send Reset Link"
                  : mode === "reset"
                    ? "Reset Password"
                    : "Sign In"}
          </button>
          {mode === "login" && (
            <button
              type="button"
              onClick={() => {
                setMode("forgot");
                setError(null);
                setInfo(null);
              }}
              className="w-full text-sm font-medium text-primary underline underline-offset-4"
            >
              Forgot password?
            </button>
          )}
          {(mode === "forgot" || mode === "reset") && (
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError(null);
                setInfo(null);
                setResetUrl(null);
              }}
              className="w-full text-sm font-medium text-primary underline underline-offset-4"
            >
              Back to login
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default LoginGate;
