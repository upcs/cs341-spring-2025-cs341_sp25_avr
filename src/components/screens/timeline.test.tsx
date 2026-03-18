import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TimelineScreen from "@/components/screens/timeline";
import { AuthProvider } from "@/components/auth-context";

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

    if (url.includes("/api/content/by-building")) {
      return Promise.resolve(
        new Response(JSON.stringify([]), { status: 200, headers: { "Content-Type": "application/json" } })
      );
    }

    return Promise.resolve(new Response("Not found", { status: 404 }));
  });
});

describe("TimelineScreen", () => {
  it("renders sample history and static archive photos when no building content exists", () => {
    render(
      <AuthProvider value={{ authenticated: false, readOnly: true, displayName: "Guest" }}>
        <TimelineScreen buildingId="unknown" onNavigate={() => {}} />
      </AuthProvider>
    );

    expect(screen.getByText(/No History Available/i)).toBeInTheDocument();
    expect(screen.getByText(/Sample History/i)).toBeInTheDocument();
    expect(screen.getByText(/Sample Photos/i)).toBeInTheDocument();
    expect(screen.getByText(/Historic view of the original engineering building\./i)).toBeInTheDocument();
  });

  it("opens the add photo form", async () => {
    render(
      <AuthProvider value={{ authenticated: true, readOnly: false, displayName: "Tester" }}>
        <TimelineScreen buildingId="chapel" onNavigate={() => {}} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Add Photo/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Add Photo/i));
    expect(screen.getByPlaceholderText(/Caption/i)).toBeInTheDocument();
  });

  it("renders manage timeline form", async () => {
    render(
      <AuthProvider value={{ authenticated: true, readOnly: false, displayName: "Tester" }}>
        <TimelineScreen buildingId="chapel" onNavigate={() => {}} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Manage Timeline/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Add Entry/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Description/i)).toBeInTheDocument();
  });
});
