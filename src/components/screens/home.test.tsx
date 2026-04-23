import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import HomeScreen from "@/components/screens/home";

const { recordElapsedMetric, useAppStore } = vi.hoisted(() => ({
  recordElapsedMetric: vi.fn(),
  useAppStore: vi.fn(),
}));

vi.mock("@/lib/performance", () => ({
  recordElapsedMetric,
}));

vi.mock("@/data/buildings", () => ({
  buildings: [
    { id: "shiley", name: "Shiley School of Engineering" },
    { id: "chapel", name: "Chapel of Christ the Teacher" },
    { id: "waldschmidt", name: "Waldschmidt Hall" },
  ],
}));

vi.mock("@/store/appStore", () => ({
  useAppStore: () => useAppStore(),
}));

vi.mock("@/components/wally-stamp", () => ({
  default: ({ collected }: { collected?: boolean }) => <div data-testid={collected ? "stamp-on" : "stamp-off"} />,
}));

vi.mock("framer-motion", async () => {
  const React = await import("react");
  const passthrough = ({ children, ...props }: { children?: ReactNode }) =>
    React.createElement("div", props, children);

  return {
    motion: new Proxy(
      {},
      {
        get: () => passthrough,
      }
    ),
  };
});

describe("HomeScreen", () => {
  beforeEach(() => {
    recordElapsedMetric.mockReset();
    useAppStore.mockReturnValue({
      stamps: new Set<string>(["shiley"]),
    });

    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());

    Object.defineProperty(HTMLMediaElement.prototype, "play", {
      configurable: true,
      writable: true,
      value: vi.fn().mockResolvedValue(undefined),
    });
  });

  it("renders progress and routes through the main actions", async () => {
    const onNavigate = vi.fn();
    render(<HomeScreen onNavigate={onNavigate} />);

    expect(screen.getByText(/1 of 3 badges collected/i)).toBeInTheDocument();
    expect(recordElapsedMetric).toHaveBeenCalledWith(
      "home-screen-initial-render",
      0,
      "Measured from page navigation start"
    );

    fireEvent.click(screen.getByRole("button", { name: /^Start$/i }));
    fireEvent.click(screen.getByRole("button", { name: /Photo Hub/i }));
    fireEvent.click(screen.getByRole("button", { name: /^Campus Quest$/i }));
    fireEvent.click(screen.getByRole("button", { name: /^About$/i }));
    fireEvent.click(screen.getByRole("button", { name: /Sponsorship Details/i }));

    expect(onNavigate).toHaveBeenNthCalledWith(1, "map");
    expect(onNavigate).toHaveBeenNthCalledWith(2, "photohub");
    expect(onNavigate).toHaveBeenNthCalledWith(3, "quest");
    expect(onNavigate).toHaveBeenNthCalledWith(4, "about");
    expect(onNavigate).toHaveBeenNthCalledWith(5, "about");

    const progressCard = screen.getByText(/Campus Quest Progress/i).closest('[tabindex="0"]');
    expect(progressCard).not.toBeNull();
    fireEvent.focus(progressCard!);

    expect(await screen.findByText(/Badge Overview/i)).toBeInTheDocument();
    expect(screen.getByText(/Shiley School of Engineering/i)).toBeInTheDocument();
    expect(screen.getByText(/Chapel of Christ the Teacher/i)).toBeInTheDocument();
  });

  it("shows a tap-to-play prompt when autoplay is blocked", async () => {
    Object.defineProperty(HTMLMediaElement.prototype, "play", {
      configurable: true,
      writable: true,
      value: vi.fn().mockRejectedValue(new Error("Autoplay blocked")),
    });

    render(<HomeScreen onNavigate={() => {}} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Tap To Play Background Video/i })).toBeInTheDocument();
    });
  });
});
