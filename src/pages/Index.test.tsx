import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Index from "@/pages/Index";

const setActiveUser = vi.fn();

vi.mock("framer-motion", async () => {
  const React = await import("react");
  const passthrough = ({ children, ...props }: { children?: ReactNode }) =>
    React.createElement("div", props, children);

  return {
    AnimatePresence: ({ children }: { children?: ReactNode }) => <>{children}</>,
    motion: new Proxy(
      {},
      {
        get: () => passthrough,
      }
    ),
  };
});

vi.mock("@/components/auth-context", () => ({
  useAuth: () => ({
    userKey: "guest:test-user",
  }),
}));

vi.mock("@/store/appStore", () => ({
  useAppStore: (selector: (state: { setActiveUser: typeof setActiveUser }) => unknown) =>
    selector({ setActiveUser }),
}));

vi.mock("@/components/screens/home", () => ({
  default: ({ onNavigate }: { onNavigate: (screen: "map" | "about" | "quest" | "photohub") => void }) => (
    <div>
      <p>Mock Home</p>
      <button onClick={() => onNavigate("about")}>Go About</button>
      <button onClick={() => onNavigate("map")}>Go Map</button>
      <button onClick={() => onNavigate("quest")}>Go Quest</button>
      <button onClick={() => onNavigate("photohub")}>Go PhotoHub</button>
    </div>
  ),
}));

vi.mock("@/components/screens/geo", () => ({
  default: ({ onBuildingSelect }: { onBuildingSelect: (buildingId: string) => void }) => (
    <div>
      <p>Mock Map</p>
      <button onClick={() => onBuildingSelect("chapel")}>Choose Chapel</button>
    </div>
  ),
}));

vi.mock("@/components/screens/timeline", () => ({
  default: ({ buildingId }: { buildingId: string }) => <div>Timeline for {buildingId}</div>,
}));

vi.mock("@/components/screens/about", () => ({
  default: ({ onNavigate }: { onNavigate: (screen: "home") => void }) => (
    <button onClick={() => onNavigate("home")}>Back Home</button>
  ),
}));

vi.mock("@/components/screens/quest", () => ({
  default: () => <div>Mock Quest</div>,
}));

vi.mock("@/components/screens/photohub", () => ({
  default: () => <div>Mock PhotoHub</div>,
}));

describe("Index", () => {
  beforeEach(() => {
    setActiveUser.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("preloads non-home screens during browser idle time", () => {
    const requestIdleCallback = vi.fn((callback: IdleRequestCallback) => {
      callback({ didTimeout: false, timeRemaining: () => 20 });
      return 42;
    });
    const cancelIdleCallback = vi.fn();
    vi.stubGlobal("requestIdleCallback", requestIdleCallback);
    vi.stubGlobal("cancelIdleCallback", cancelIdleCallback);

    const { unmount } = render(<Index />);

    expect(requestIdleCallback).toHaveBeenCalledWith(expect.any(Function), { timeout: 3000 });

    unmount();
    expect(cancelIdleCallback).toHaveBeenCalledWith(42);
  });

  it("sets the active user and switches between screens", async () => {
    render(<Index />);

    expect(setActiveUser).toHaveBeenCalledWith("guest:test-user");
    expect(screen.getByText(/Mock Home/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Go About/i }));
    expect(await screen.findByRole("button", { name: /Back Home/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Back Home/i }));
    fireEvent.click(screen.getByRole("button", { name: /Go Quest/i }));
    expect(await screen.findByText(/Mock Quest/i)).toBeInTheDocument();
  });

  it("opens the timeline after selecting a building from the map", async () => {
    render(<Index />);

    fireEvent.click(screen.getByRole("button", { name: /Go Map/i }));
    expect(await screen.findByText(/Mock Map/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Choose Chapel/i }));
    expect(await screen.findByText(/Timeline for chapel/i)).toBeInTheDocument();
  });
});
