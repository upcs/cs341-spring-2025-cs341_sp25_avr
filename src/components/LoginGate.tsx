import type { FormEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import { AuthProvider } from "./auth-context";
import { getSession, login, logout, signup, verifyEmail } from "@/lib/auth-client";

type AuthState = "loading" | "authenticated" | "guest" | "unauthenticated";
type AuthMode = "login" | "signup";

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
  const [submitting, setSubmitting] = useState(false);
  const [displayName, setDisplayName] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    const verifyToken = new URLSearchParams(window.location.search).get("verify");

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
      })
      .catch(() => {
        if (cancelled) return;
        setAuthState("unauthenticated");
        setError("Unable to verify your session.");
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

    try {
      const payload =
        mode === "signup"
          ? form
          : { email: form.email, password: form.password };

        const data = mode === "signup"
          ? await signup(payload as { name: string; email: string; password: string })
          : await login(payload as { email: string; password: string });

      if (mode === "signup") {
        setForm(emptyForm);
        setMode("login");
        setInfo(data.message || "Check your email to verify your account.");
        setVerificationUrl(data.verificationUrl || null);
        return;
      }

      setDisplayName(data.name || data.email || "");
      setAuthState("authenticated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
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
            {mode === "signup" ? "Create UP Account Access" : "Campus History Login"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signup"
              ? "Sign up with your @up.edu email to access the campus archive."
              : "Sign in with the @up.edu account you created for the campus archive."}
          </p>
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
          <input
            type="email"
            placeholder="name@up.edu"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground"
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground"
          />
          {mode === "signup" && (
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
          {error && <p className="text-sm text-rose-500">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {submitting ? "Submitting..." : mode === "signup" ? "Create Account" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginGate;
