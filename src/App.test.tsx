import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "@/App";

vi.mock("@/components/LoginGate", () => ({
  default: ({ children }: { children: ReactNode }) => <div data-testid="login-gate">{children}</div>,
}));

vi.mock("@/components/ui/toaster", () => ({
  Toaster: () => <div data-testid="toaster" />,
}));

vi.mock("@/components/ui/sonner", () => ({
  Toaster: () => <div data-testid="sonner" />,
}));

vi.mock("@/components/ui/tooltip", () => ({
  TooltipProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("@/pages/Index", () => ({
  default: () => <div>Index Screen</div>,
}));

describe("App", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/");
  });

  it("renders the main app route inside LoginGate", () => {
    render(<App />);

    expect(screen.getByTestId("login-gate")).toBeInTheDocument();
    expect(screen.getByTestId("toaster")).toBeInTheDocument();
    expect(screen.getByTestId("sonner")).toBeInTheDocument();
    expect(screen.getByText(/Index Screen/i)).toBeInTheDocument();
  });

  it("renders the not-found route for an unknown path", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    window.history.pushState({}, "", "/missing-page");

    render(<App />);

    expect(screen.getByText("404")).toBeInTheDocument();
    expect(screen.getByText(/Oops! Page not found/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Return to Home/i })).toHaveAttribute("href", "/");

    consoleError.mockRestore();
  });
});
