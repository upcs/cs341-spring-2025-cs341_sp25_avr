import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import TimelineScreen from "@/components/screens/timeline";
import { AuthProvider } from "@/components/auth-context";

const mockFetch = vi.fn();

vi.mock("@/data/geoTable", () => ({
  buildings: [
    { id: "chapel", name: "Chapel of Christ the Teacher", lat: 0, lng: 0, radius: 10 },
  ],
  buildingContent: {
    chapel: [
      { buildingId: "chapel", year: 1986, description: "Chapel history" },
    ],
  },
  archivePhotos: [
    {
      id: "chapel-1986",
      buildingId: "chapel",
      buildingName: "chapel",
      year: 1986,
      caption: "The Chapel of Christ the Teacher shortly after dedication.",
      imageUrl: "/archiveContent/chapel/1986.jpg",
    },
  ],
}));

vi.mock("@/store/appStore", () => ({
  useAppStore: () => ({
    stamps: new Set<string>(),
    addStamp: vi.fn(),
  }),
}));

vi.mock("@/components/wally-stamp", () => ({
  default: () => <div data-testid="wally-stamp" />,
}));

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
        new Response(
          JSON.stringify([
            {
              buildingName: "Chapel of Christ the Teacher",
              year: 1992,
              description: "Backend chapel history",
            },
          ]),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );
    }

    if (url === "/api/content/timeline") {
      return Promise.resolve(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
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

    expect(screen.getByText(/Building Not Found/i)).toBeInTheDocument();
    expect(screen.getByText(/Sample History/i)).toBeInTheDocument();
    expect(screen.getByText(/Chapel history/i)).toBeInTheDocument();
    expect(screen.getByText(/Chapel of Christ the Teacher/i)).toBeInTheDocument();
  });

  it("renders backend timeline entries when they are available", async () => {
    render(
      <AuthProvider value={{ authenticated: false, readOnly: true, displayName: "Guest" }}>
        <TimelineScreen buildingId="chapel" onNavigate={() => {}} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/Backend chapel history/i).length).toBeGreaterThan(0);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/content/by-building?buildingName=Chapel+of+Christ+the+Teacher&buildingId=chapel")
    );
    expect(screen.queryAllByText(/^Chapel history$/i)).toHaveLength(0);
  });

  it("falls back to bundled timeline entries when the backend timeline is unavailable", async () => {
    mockFetch.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/api/content/by-building")) {
        return Promise.resolve(new Response("Server error", { status: 500 }));
      }

      if (url.includes("/api/content/photos?")) {
        return Promise.resolve(
          new Response(JSON.stringify([]), { status: 200, headers: { "Content-Type": "application/json" } })
        );
      }

      return Promise.resolve(new Response("Not found", { status: 404 }));
    });

    render(
      <AuthProvider value={{ authenticated: false, readOnly: true, displayName: "Guest" }}>
        <TimelineScreen buildingId="chapel" onNavigate={() => {}} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/Chapel history/i).length).toBeGreaterThan(0);
    });

    expect(screen.getByText(/Live timeline unavailable/i)).toBeInTheDocument();
  });

  it("falls back to bundled timeline entries when the backend returns no rows", async () => {
    mockFetch.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/api/content/by-building")) {
        return Promise.resolve(
          new Response(JSON.stringify([]), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        );
      }

      if (url.includes("/api/content/photos?")) {
        return Promise.resolve(
          new Response(JSON.stringify([]), { status: 200, headers: { "Content-Type": "application/json" } })
        );
      }

      return Promise.resolve(new Response("Not found", { status: 404 }));
    });

    render(
      <AuthProvider value={{ authenticated: false, readOnly: true, displayName: "Guest" }}>
        <TimelineScreen buildingId="chapel" onNavigate={() => {}} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/Chapel history/i).length).toBeGreaterThan(0);
    });

    expect(screen.getByText(/No live archive rows yet/i)).toBeInTheDocument();
  });

  it("shows a changing archive image for the current timeline entry", async () => {
    mockFetch.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/api/content/by-building")) {
        return Promise.resolve(
          new Response(JSON.stringify([]), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        );
      }

      if (url.includes("/api/content/photos?")) {
        return Promise.resolve(
          new Response(JSON.stringify([]), { status: 200, headers: { "Content-Type": "application/json" } })
        );
      }

      return Promise.resolve(new Response("Not found", { status: 404 }));
    });

    render(
      <AuthProvider value={{ authenticated: false, readOnly: true, displayName: "Guest" }}>
        <TimelineScreen buildingId="chapel" onNavigate={() => {}} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByAltText(/shortly after dedication/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Archive image from this year|Archive image near/i)).toBeInTheDocument();
    expect(screen.getByText(/Photo year 1986/i)).toBeInTheDocument();
  });

  it("resolves a building when the timeline screen receives the building name instead of the id", async () => {
    mockFetch.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/api/content/by-building")) {
        return Promise.resolve(
          new Response(JSON.stringify([]), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        );
      }

      if (url.includes("/api/content/photos?")) {
        return Promise.resolve(
          new Response(JSON.stringify([]), { status: 200, headers: { "Content-Type": "application/json" } })
        );
      }

      return Promise.resolve(new Response("Not found", { status: 404 }));
    });

    render(
      <AuthProvider value={{ authenticated: false, readOnly: true, displayName: "Guest" }}>
        <TimelineScreen buildingId="Chapel of Christ the Teacher" onNavigate={() => {}} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/Chapel history/i).length).toBeGreaterThan(0);
    });

    expect(screen.getByRole("heading", { name: /Chapel of Christ the Teacher/i })).toBeInTheDocument();
  });

  it("submits a new timeline entry for authenticated users", async () => {
    render(
      <AuthProvider value={{ authenticated: true, readOnly: false, displayName: "Tester" }}>
        <TimelineScreen buildingId="chapel" onNavigate={() => {}} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Manage Timeline/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText(/^Year$/i), { target: { value: "2001" } });
    fireEvent.change(screen.getByPlaceholderText(/Description/i), { target: { value: "Added in test" } });
    fireEvent.click(screen.getByText(/Add Entry/i));

    await waitFor(() => {
      expect(screen.getByText(/Added in test/i)).toBeInTheDocument();
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/content/timeline",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
    );
  });
});
