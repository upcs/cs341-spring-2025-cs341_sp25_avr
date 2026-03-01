import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import TimelineScreen from "@/components/screens/timeline";

const mockFetch = vi.fn();

global.fetch = mockFetch as unknown as typeof fetch;

beforeEach(() => {
  mockFetch.mockReset();

  // Minimal ResizeObserver mock for recharts
  if (!global.ResizeObserver) {
    global.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
  }

  mockFetch.mockImplementation((input: RequestInfo | URL) => {
    const url = String(input);

    if (url.includes("/api/content/sample")) {
      return Promise.resolve(
        new Response(
          JSON.stringify([
            { buildingName: "chapel", year: 1986, description: "Sample history" },
          ]),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );
    }

    if (url.includes("/api/content/photos?")) {
      return Promise.resolve(
        new Response(
          JSON.stringify([
            { buildingName: "chapel", year: 1986, caption: "Photo caption", imageUrl: "/archiveContent/chapel/1986.jpg" },
          ]),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );
    }

    if (url.includes("/api/content/photos/stats")) {
      return Promise.resolve(
        new Response(
          JSON.stringify([
            { buildingName: "chapel", count: 3 },
          ]),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );
    }

    if (url.includes("/api/content/by-building")) {
      return Promise.resolve(
        new Response(JSON.stringify([]), { status: 200, headers: { "Content-Type": "application/json" } })
      );
    }

    return Promise.resolve(new Response("Not found", { status: 404 }));
  });
});

describe("TimelineScreen", () => {
  it("renders sample history, photos, and stats when no building content exists", async () => {
    render(<TimelineScreen buildingId="unknown" onNavigate={() => {}} />);

    expect(screen.getByText(/No History Available/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Sample History/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Sample Photos/i)).toBeInTheDocument();
    expect(screen.getByText(/Photo Breakdown/i)).toBeInTheDocument();
    expect(screen.getByText(/Photo caption/i)).toBeInTheDocument();
  });

  it("opens the add photo form", async () => {
    render(<TimelineScreen buildingId="chapel" onNavigate={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText(/Add Photo/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Add Photo/i));
    expect(screen.getByPlaceholderText(/Caption/i)).toBeInTheDocument();
  });

  it("renders manage timeline form", async () => {
    render(<TimelineScreen buildingId="chapel" onNavigate={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText(/Manage Timeline/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Add Entry/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Description/i)).toBeInTheDocument();
  });
});
