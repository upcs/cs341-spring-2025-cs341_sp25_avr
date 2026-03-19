
// Author: Tony Phan

import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import QuestScreen from "./quest";
import { useAppStore } from "@/store/appStore";

const mockAddStamp = vi.fn();

vi.mock("@/store/appStore", () => ({
  useAppStore: vi.fn(),
}));

describe("QuestScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (useAppStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      stamps: new Set<string>(),
      addStamp: mockAddStamp,
    });
  });

  it("renders the title", () => {
    render(<QuestScreen onNavigate={vi.fn()} />);
    expect(screen.getByText("Campus Stamp Quest")).toBeInTheDocument();
  });

  it("shows initial progress", () => {
    render(<QuestScreen onNavigate={vi.fn()} />);
    expect(screen.getByText(/0\s*\/\s*12/)).toBeInTheDocument();
  });

  it("opens QR scanner modal when Scan QR Code is clicked", () => {
    render(<QuestScreen onNavigate={vi.fn()} />);
    fireEvent.click(screen.getByText(/Scan QR Code/i));
    expect(screen.getByText(/^Scan QR Code$/i)).toBeInTheDocument();
    expect(screen.getByText(/Cancel/i)).toBeInTheDocument();
  });

  it("shows QR help text when info button is clicked", () => {
    render(<QuestScreen onNavigate={vi.fn()} />);
    fireEvent.click(screen.getByText(/How does QR scanning work\?/i));
    expect(
      screen.getByText(/Visit campus buildings and scan the QR codes/i)
    ).toBeInTheDocument();
  });

  it("shows quest complete when all 12 stamps are collected", () => {
    const allStamps = new Set([
      "stamp1","stamp2","stamp3","stamp4","stamp5","stamp6",
      "stamp7","stamp8","stamp9","stamp10","stamp11","stamp12"
    ]);

    (useAppStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      stamps: allStamps,
      addStamp: mockAddStamp,
    });

    render(<QuestScreen onNavigate={vi.fn()} />);
    expect(screen.getByText(/Quest Complete!/i)).toBeInTheDocument();
  });
});

