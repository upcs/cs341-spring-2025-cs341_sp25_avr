import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Menu, Home, HelpCircle } from "lucide-react";
import { buildings, CAMPUS_CENTER, DEFAULT_ZOOM } from "@/data/buildings";
import type { Screen } from "@/pages/Index";

interface MapScreenProps {
  onNavigate: (screen: Screen) => void;
  onBuildingSelect: (buildingId: string) => void;
}

const MapScreen = ({ onNavigate, onBuildingSelect }: MapScreenProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const userCircleRef = useRef<L.Circle | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [helpVisible, setHelpVisible] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationBlocked, setLocationBlocked] = useState(false);
  const [showManualChooser, setShowManualChooser] = useState(false);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, {
      center: [CAMPUS_CENTER.lat, CAMPUS_CENTER.lng],
      zoom: DEFAULT_ZOOM,
      zoomControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Custom purple icon
    const purpleIcon = L.divIcon({
      className: "custom-marker",
      html: `<div style="width:28px;height:28px;border-radius:50%;background:hsl(270,54%,34%);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);cursor:pointer;"></div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    buildings.forEach((building) => {
      const marker = L.marker([building.lat, building.lng], { icon: purpleIcon }).addTo(map);
      marker.bindTooltip(building.name, {
        permanent: false,
        direction: "top",
        offset: [0, -16],
        className: "building-tooltip",
      });
      marker.on("click", () => {
        onBuildingSelect(building.id);
      });
    });

    mapInstance.current = map;

    // Auto-hide help after 4 seconds
    const timer = setTimeout(() => setHelpVisible(false), 4000);

    const handlePosition = (pos: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = pos.coords;
      setLocationError(null);
      setLocationBlocked(false);
      setShowManualChooser(false);

      const userIcon = L.divIcon({
        className: "user-location-marker",
        html: `<div style="width:16px;height:16px;border-radius:50%;background:#4285F4;border:3px solid white;box-shadow:0 0 8px rgba(66,133,244,0.6);"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([latitude, longitude]);
      } else {
        userMarkerRef.current = L.marker([latitude, longitude], { icon: userIcon, zIndexOffset: 1000 })
          .addTo(map)
          .bindTooltip("You are here", { direction: "top", offset: [0, -10] });
      }

      if (userCircleRef.current) {
        userCircleRef.current.setLatLng([latitude, longitude]).setRadius(accuracy);
      } else {
        userCircleRef.current = L.circle([latitude, longitude], {
          radius: accuracy,
          color: "#4285F4",
          fillColor: "#4285F4",
          fillOpacity: 0.1,
          weight: 1,
        }).addTo(map);
      }
    };

    const handlePositionError = (err: GeolocationPositionError) => {
      if (err.code === 1) {
        setLocationBlocked(true);
        setLocationError("Location access denied. Enable it in your browser settings.");
      } else if (err.code === 2) {
        setLocationBlocked(false);
        setLocationError("Location is unavailable on this device or network.");
      } else if (err.code === 3) {
        setLocationBlocked(false);
        setLocationError("Location request timed out.");
      } else {
        setLocationBlocked(false);
        setLocationError("Unable to get location.");
      }
      setShowManualChooser(true);
    };

    const startWatching = () => {
      if (!("geolocation" in navigator)) {
        setLocationError("Geolocation is not supported by this browser.");
        return;
      }
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      watchIdRef.current = navigator.geolocation.watchPosition(
        handlePosition,
        handlePositionError,
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
      );
    };

    const checkPermissionsAndStart = async () => {
      if (!("geolocation" in navigator)) {
        setLocationError("Geolocation is not supported by this browser.");
        return;
      }
      if ("permissions" in navigator && typeof navigator.permissions.query === "function") {
        try {
          const status = await navigator.permissions.query({ name: "geolocation" as PermissionName });
          if (status.state === "denied") {
            setLocationBlocked(true);
            setLocationError("Location is blocked. Enable it in your browser settings.");
            return;
          }
        } catch {
          // ignore permissions errors and try to start watch
        }
      }
      startWatching();
    };

    checkPermissionsAndStart();

    return () => {
      clearTimeout(timer);
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [onBuildingSelect]);

  return (
    <div className="relative h-screen w-full">
      <div ref={mapRef} className="absolute inset-0 z-0" />

      {/* Location error */}
      {locationError && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 glass-card rounded-xl px-4 py-2 shadow-lg text-center max-w-xs">
          <p className="text-xs text-muted-foreground">{locationError}</p>
          <button
            onClick={() => {
              if (!("geolocation" in navigator)) return;
              navigator.geolocation.getCurrentPosition(
                () => {
                  setLocationBlocked(false);
                  setLocationError(null);
                  setShowManualChooser(false);
                },
                (err) => {
                  if (err.code === 1) {
                    setLocationBlocked(true);
                    setLocationError("Location access denied. Enable it in your browser settings.");
                  } else if (err.code === 2) {
                    setLocationBlocked(false);
                    setLocationError("Location is unavailable on this device or network.");
                  } else if (err.code === 3) {
                    setLocationBlocked(false);
                    setLocationError("Location request timed out.");
                  } else {
                    setLocationBlocked(false);
                    setLocationError("Unable to get location.");
                  }
                  setShowManualChooser(true);
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
              );
            }}
            className="mt-2 text-xs font-semibold text-primary underline"
          >
            Try again
          </button>
          <button
            onClick={() => setShowManualChooser((current) => !current)}
            className="mt-2 ml-3 text-xs font-semibold text-primary underline"
          >
            {showManualChooser ? "Hide manual selection" : "Choose building manually"}
          </button>
        </div>
      )}

      {showManualChooser && (
        <div className="absolute bottom-24 left-1/2 z-20 w-[min(92vw,26rem)] -translate-x-1/2 glass-card rounded-xl p-4 shadow-lg">
          <p className="text-sm font-semibold text-foreground">Choose a building manually</p>
          <p className="mt-1 text-xs text-muted-foreground">
            If location is unavailable, you can still open a building directly.
          </p>
          <div className="mt-3 grid max-h-64 grid-cols-1 gap-2 overflow-y-auto">
            {buildings.map((building) => (
              <button
                key={building.id}
                onClick={() => onBuildingSelect(building.id)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-left text-sm text-foreground hover:bg-muted transition-colors"
              >
                {building.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Help overlay */}
      {helpVisible && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 glass-card rounded-xl px-5 py-3 shadow-lg text-center max-w-xs animate-fade-in-up">
          <p className="text-sm font-medium text-foreground">Tap a building marker to explore its history</p>
        </div>
      )}

      {/* Menu button */}
      <div className="absolute top-4 left-4 z-20">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium shadow-lg hover:shadow-xl transition-all"
        >
          <Menu className="w-4 h-4" />
          Menu
        </button>

        {menuOpen && (
          <div className="mt-2 glass-card rounded-xl shadow-xl overflow-hidden min-w-[160px]">
            <button
              onClick={() => onNavigate("home")}
              className="flex items-center gap-2 w-full px-4 py-3 text-left text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <Home className="w-4 h-4" /> Home
            </button>
          </div>
        )}
      </div>

      {/* Help button */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={() => setHelpVisible(!helpVisible)}
          className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
      </div>

      <style>{`
        .building-tooltip {
          background: hsl(270, 54%, 34%);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 6px 12px;
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          font-weight: 500;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        .building-tooltip::before {
          border-top-color: hsl(270, 54%, 34%) !important;
        }
        .leaflet-container {
          font-family: 'Inter', sans-serif;
        }
      `}</style>
    </div>
  );
};

export default MapScreen;
