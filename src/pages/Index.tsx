import { useLayoutEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import HomeScreen from "@/components/screens/home";
import MapScreen from "@/components/screens/geo";
import TimelineScreen from "@/components/screens/timeline";
import AboutScreen from "@/components/screens/about";
import QuestScreen from "@/components/screens/quest";
import PhotoHubScreen from "@/components/screens/photohub";
import { useAppStore } from "@/store/appStore";

export type Screen = "home" | "map" | "timeline" | "about" | "quest" | "photohub";

const APP_STORE_STORAGE_KEY = "avr-app-store";

const Index = () => {
  const [screen, setScreen] = useState<Screen>("home");
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
  const timelineRenderStart = useRef<number | null>(null);
  const resetStamps = useAppStore((state) => state.resetStamps);

  useLayoutEffect(() => {
    if (typeof window !== "undefined") {
      const rawStore = window.localStorage.getItem(APP_STORE_STORAGE_KEY);
      if (rawStore) {
        try {
          const parsed = JSON.parse(rawStore) as {
            state?: { stamps?: string[]; __stampResetVersion?: string; photos?: unknown };
            version?: number;
          };

          if (parsed.state && ("stamps" in parsed.state || "__stampResetVersion" in parsed.state)) {
            delete parsed.state.stamps;
            delete parsed.state.__stampResetVersion;
            window.localStorage.setItem(APP_STORE_STORAGE_KEY, JSON.stringify(parsed));
          }
        } catch {
          window.localStorage.removeItem(APP_STORE_STORAGE_KEY);
        }
      }
    }

    resetStamps();
  }, [resetStamps]);

  const handleBuildingSelect = (buildingId: string) => {
    timelineRenderStart.current = typeof performance !== "undefined" ? performance.now() : null;
    setSelectedBuilding(buildingId);
    setScreen("timeline");
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <AnimatePresence mode="wait">
        {screen === "home" && (
          <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
            <HomeScreen onNavigate={setScreen} />
          </motion.div>
        )}
        {screen === "map" && (
          <motion.div key="map" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
            <MapScreen onNavigate={setScreen} onBuildingSelect={handleBuildingSelect} />
          </motion.div>
        )}
        {screen === "timeline" && selectedBuilding && (
          <motion.div key="timeline" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.4 }}>
            <TimelineScreen buildingId={selectedBuilding} onNavigate={setScreen} renderStartMs={timelineRenderStart.current} />
          </motion.div>
        )}
        {screen === "about" && (
          <motion.div key="about" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
            <AboutScreen onNavigate={setScreen} />
          </motion.div>
        )}
        {screen === "quest" && (
          <motion.div key="quest" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
            <QuestScreen onNavigate={setScreen} />
          </motion.div>
        )}
        {screen === "photohub" && (
          <motion.div key="photohub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
            <PhotoHubScreen onNavigate={setScreen} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
