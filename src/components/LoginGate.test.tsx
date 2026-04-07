import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import LoginGate from "@/components/LoginGate";

const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;

describe("LoginGate", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("shows the login screen when no session exists", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ authenticated: false }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    render(<LoginGate><div>Secret app</div></LoginGate>);

    await waitFor(() => {
      expect(screen.getByText(/Campus History Login/i)).toBeInTheDocument();
    });
  });

  it("lets a user continue in guest mode", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ authenticated: false }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    render(<LoginGate><div>Secret app</div></LoginGate>);

    await waitFor(() => screen.getByText(/Campus History Login/i));
    fireEvent.click(screen.getByRole("button", { name: /Continue as Guest/i }));

    expect(screen.getByText(/Guest view/i)).toBeInTheDocument();
    expect(screen.getByText("Secret app")).toBeInTheDocument();
  });

  it("renders children after a successful login", async () => {
    mockFetch
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ authenticated: false }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true, email: "user@up.edu" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

    render(<LoginGate><div>Secret app</div></LoginGate>);

    await waitFor(() => screen.getByText(/Campus History Login/i));
    fireEvent.change(screen.getByPlaceholderText(/name@up.edu/i), { target: { value: "user@up.edu" } });
    fireEvent.change(screen.getByPlaceholderText(/^Password$/i), { target: { value: "campuspass" } });
    fireEvent.click(screen.getByRole("button", { name: /Sign In/i }));

    await waitFor(() => {
      expect(screen.getByText("Secret app")).toBeInTheDocument();
    });
  });

  it("submits sign up with a up.edu email", async () => {
    mockFetch
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ authenticated: false }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true, email: "newuser@up.edu", message: "Check your @up.edu email for the verification link before signing in.", verificationUrl: "http://localhost:3000/?verify=test-token" }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        })
      );

    render(<LoginGate><div>Secret app</div></LoginGate>);

    await waitFor(() => screen.getByText(/Campus History Login/i));
    fireEvent.click(screen.getByRole("button", { name: /Sign Up/i }));
    fireEvent.change(screen.getByPlaceholderText(/Full name/i), { target: { value: "New User" } });
    fireEvent.change(screen.getByPlaceholderText(/name@up.edu/i), { target: { value: "newuser@up.edu" } });
    fireEvent.change(screen.getByPlaceholderText(/^Password$/i), { target: { value: "campuspass" } });
    fireEvent.click(screen.getByRole("button", { name: /Create Account/i }));

    await waitFor(() => {
      expect(screen.getByText(/Check your @up.edu email/i)).toBeInTheDocument();
    });
    expect(screen.getByRole("link", { name: /Open verification link/i })).toHaveAttribute(
      "href",
      "http://localhost:3000/?verify=test-token"
    );

    expect(mockFetch).toHaveBeenLastCalledWith(
      "/api/auth/signup",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
      })
    );
  });
});
