import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import QuestScreen from "@/components/screens/quest";

const addStamp = vi.fn();

vi.mock("@/data/geoTable", () => ({
  buildings: [
    { id: "shiley", name: "Shiley School of Engineering" },
    { id: "chapel", name: "Chapel of Christ the Teacher" },
  ],
}));

vi.mock("@/store/appStore", () => ({
  useAppStore: () => ({
    stamps: new Set<string>(),
    addStamp,
  }),
}));

vi.mock("@/components/wally-stamp", () => ({
  default: () => <div data-testid="wally-stamp" />,
}));

describe("QuestScreen", () => {
  beforeEach(() => {
    addStamp.mockReset();
  });

  it("renders scan-only guidance on the main quest screen", async () => {
    render(<QuestScreen onNavigate={() => {}} />);

    expect(screen.getByText(/Scan Required/i)).toBeInTheDocument();
    expect(screen.getByText(/Badge progress always starts at zero/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Scan QR Code/i })).toBeInTheDocument();
  });

  it("does not render upload or manual redemption controls", async () => {
    render(<QuestScreen onNavigate={() => {}} />);

    expect(screen.queryByRole("button", { name: /Upload QR Image/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Redeem QR Link/i })).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/https:\/\/scanned.page\/p\/qEK1lt/i)).not.toBeInTheDocument();
    expect(addStamp).not.toHaveBeenCalled();
  });
});
