import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import PhotoHubScreen from "@/components/screens/photohub";
import { AuthProvider } from "@/components/auth-context";

const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;

vi.mock("@/data/geoTable", () => ({
  buildings: [
    { id: "chapel", name: "Chapel of Christ the Teacher" },
    { id: "franz", name: "Franz Hall" },
  ],
}));

describe("PhotoHubScreen", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("shows the photo grid in guest mode and disables upload", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify([
          { id: 1, buildingName: "Chapel of Christ the Teacher", year: 1986, caption: "Chapel photo", imageUrl: "/chapel.jpg" },
        ]),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    render(
      <AuthProvider value={{ authenticated: false, readOnly: true, displayName: "Guest" }}>
        <PhotoHubScreen onNavigate={() => {}} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Chapel photo/i)).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: /Upload/i })).toBeDisabled();
  });

  it("filters photos by building when cycling the filter navigation", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify([
          { id: 1, buildingName: "Chapel of Christ the Teacher", year: 1986, caption: "Chapel photo", imageUrl: "/chapel.jpg" },
          { id: 2, buildingName: "Franz Hall", year: 1996, caption: "Franz photo", imageUrl: "/franz.jpg" },
        ]),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    render(
      <AuthProvider value={{ authenticated: false, readOnly: true, displayName: "Guest" }}>
        <PhotoHubScreen onNavigate={() => {}} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Chapel photo/i)).toBeInTheDocument();
      expect(screen.getByText(/Franz photo/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Next building filter/i }));

    await waitFor(() => {
      expect(screen.getByText(/Chapel of Christ the Teacher/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Chapel photo/i)).toBeInTheDocument();
    expect(screen.queryByText(/Franz photo/i)).not.toBeInTheDocument();
  });

  it("opens the upload sheet for authenticated users", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    render(
      <AuthProvider value={{ authenticated: true, readOnly: false, displayName: "Tester" }}>
        <PhotoHubScreen onNavigate={() => {}} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Open upload panel/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Open upload panel/i }));
    expect(screen.getByRole("heading", { name: /Upload Photo/i })).toBeInTheDocument();
  });
});
