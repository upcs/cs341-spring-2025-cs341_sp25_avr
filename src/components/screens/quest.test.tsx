import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

  it("renders the manual QR fallback on the main quest screen", async () => {
    render(<QuestScreen onNavigate={() => {}} />);

    expect(screen.getByText(/Manual QR fallback/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/https:\/\/scanned.page\/p\/qEK1lt/i)).toBeInTheDocument();
  });

  it("shows an error for an invalid manual QR code", async () => {
    render(<QuestScreen onNavigate={() => {}} />);

    fireEvent.change(screen.getByPlaceholderText(/https:\/\/scanned.page\/p\/qEK1lt/i), {
      target: { value: "https://example.com/not-a-campus-code" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Redeem QR Link/i }));

    await waitFor(() => {
      expect(screen.getByText(/not one of the campus quest codes/i)).toBeInTheDocument();
    });
  });

  it("unlocks a stamp from a known manual QR value", async () => {
    render(<QuestScreen onNavigate={() => {}} />);

    fireEvent.change(screen.getByPlaceholderText(/https:\/\/scanned.page\/p\/qEK1lt/i), {
      target: { value: "https://scanned.page/p/qEK1lt" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Redeem QR Link/i }));

    await waitFor(() => {
      expect(screen.getByText(/Unlocked Shiley School of Engineering/i)).toBeInTheDocument();
    });

    expect(addStamp).toHaveBeenCalledWith("shiley");
  });
});
