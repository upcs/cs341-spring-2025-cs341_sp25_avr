import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AboutScreen from "@/components/screens/about";

describe("AboutScreen", () => {
  it("renders archive support links and navigates home", () => {
    const onNavigate = vi.fn();

    render(<AboutScreen onNavigate={onNavigate} />);

    fireEvent.click(screen.getByRole("button", { name: /Home/i }));
    expect(onNavigate).toHaveBeenCalledWith("home");

    expect(screen.getByRole("link", { name: /Donate To The Archive/i })).toHaveAttribute(
      "href",
      "https://www.up.edu/alumni/donate/index.html"
    );
    expect(screen.getByRole("link", { name: /Email About Giving/i })).toHaveAttribute(
      "href",
      "mailto:giving@up.edu?subject=Campus%20History%20Archive%20Donation"
    );
    expect(screen.getByRole("link", { name: /Become A Sponsor/i })).toHaveAttribute(
      "href",
      "mailto:giving@up.edu?subject=Campus%20History%20Archive%20Sponsorship"
    );
  });
});
