import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockMap = {
  remove: vi.fn(),
};

vi.mock("leaflet", () => {
  const marker = () => {
    const api = {
      addTo: vi.fn(() => api),
      bindTooltip: vi.fn(() => api),
      on: vi.fn(() => api),
      setLatLng: vi.fn(() => api),
    };
    return api;
  };

  const circle = () => {
    const api = {
      addTo: vi.fn(() => api),
      setLatLng: vi.fn(() => api),
      setRadius: vi.fn(() => api),
    };
    return api;
  };

  return {
    default: {
      map: vi.fn(() => mockMap),
      tileLayer: vi.fn(() => ({ addTo: vi.fn() })),
      divIcon: vi.fn(() => ({})),
      marker: vi.fn(marker),
      circle: vi.fn(circle),
    },
  };
});

vi.mock("@/data/geoTable", () => ({
  CAMPUS_CENTER: { lat: 45.57, lng: -122.72 },
  DEFAULT_ZOOM: 16,
  buildings: [
    { id: "chapel", name: "Chapel of Christ the Teacher", lat: 45.571, lng: -122.726, radius: 20 },
    { id: "franz", name: "Franz Hall", lat: 45.572, lng: -122.727, radius: 20 },
  ],
}));

import MapScreen from "@/components/screens/geo";

describe("MapScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    Object.defineProperty(global.navigator, "permissions", {
      configurable: true,
      value: {
        query: vi.fn().mockResolvedValue({ state: "denied" }),
      },
    });

    Object.defineProperty(global.navigator, "geolocation", {
      configurable: true,
      value: {
        watchPosition: vi.fn(),
        clearWatch: vi.fn(),
        getCurrentPosition: vi.fn(),
      },
    });
  });

  it("lets the user choose a building manually when location permission is denied", async () => {
    const onBuildingSelect = vi.fn();

    render(<MapScreen onNavigate={() => {}} onBuildingSelect={onBuildingSelect} />);

    await waitFor(() => {
      expect(screen.getByText(/Location is blocked/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Choose building manually/i }));

    await waitFor(() => {
      expect(screen.getByText(/Choose a building manually/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Franz Hall/i }));
    expect(onBuildingSelect).toHaveBeenCalledWith("franz");
  });
});
