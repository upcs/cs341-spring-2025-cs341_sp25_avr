
// Author: Tony Phan

import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import QuestScreen from "./quest";
import { useAppStore } from "@/store/appStore";

// Mock the store
const mockAddStamp = jest.fn();
const mockStamps = new Set<string>();

jest.mock("@/store/appStore", () => ({
  useAppStore: jest.fn(),
}));

describe("QuestScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAppStore as unknown as jest.Mock).mockReturnValue({
      stamps: mockStamps,
      addStamp: mockAddStamp,
    });
  });

  it("renders the title", () => {
    render(<QuestScreen onNavigate={jest.fn()} />);
    expect(screen.getByText("Campus Stamp Quest")).toBeInTheDocument();
  });

  it("shows initial progress", () => {
    mockStamps.clear();
    render(<QuestScreen onNavigate={jest.fn()} />);
    expect(screen.getByText(/0 \/ 12/)).toBeInTheDocument();
  });

  it("adds a stamp when QR button is clicked", () => {
    mockStamps.clear();
    render(<QuestScreen onNavigate={jest.fn()} />);
    fireEvent.click(screen.getByText(/Scan QR Code/i));
    expect(mockAddStamp).toHaveBeenCalled();
  });
});