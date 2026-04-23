import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import HomeScreen from "@/components/screens/home";
import { useAuth } from "@/components/auth-context";
import { useAppStore } from "@/store/appStore";

export type Screen = "home" | "map" | "timeline" | "about" | "quest" | "photohub";

const screenImporters = {
  map: () => import("@/components/screens/geo"),
  timeline: () => import("@/components/screens/timeline"),
  about: () => import("@/components/screens/about"),
  quest: () => import("@/components/screens/quest"),
  photohub: () => import("@/components/screens/photohub"),
};

const MapScreen = lazy(screenImporters.map);
const TimelineScreen = lazy(screenImporters.timeline);
const AboutScreen = lazy(screenImporters.about);
const QuestScreen = lazy(screenImporters.quest);
const PhotoHubScreen = lazy(screenImporters.photohub);

const ScreenFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
    <div className="rounded-2xl border border-border bg-card px-6 py-5 text-sm text-muted-foreground shadow-sm">
      Loading campus experience...
    </div>
  </div>
);

const Index = () => {
  const [screen, setScreen] = useState<Screen>("home");
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
  const timelineRenderStart = useRef<number | null>(null);
  const { userKey } = useAuth();
  const setActiveUser = useAppStore((state) => state.setActiveUser);

  useLayoutEffect(() => {
    setActiveUser(userKey);
  }, [setActiveUser, userKey]);

  useEffect(() => {
    if (screen !== "home") return;

    const preloadNonHomeScreens = () => {
      void screenImporters.map();
      void screenImporters.timeline();
      void screenImporters.about();
      void screenImporters.quest();
      void screenImporters.photohub();
    };

    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(preloadNonHomeScreens, { timeout: 3000 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = window.setTimeout(preloadNonHomeScreens, 1500);
    return () => window.clearTimeout(timeoutId);
  }, [screen]);

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
            <Suspense fallback={<ScreenFallback />}>
              <MapScreen onNavigate={setScreen} onBuildingSelect={handleBuildingSelect} />
            </Suspense>
          </motion.div>
        )}
        {screen === "timeline" && selectedBuilding && (
          <motion.div key="timeline" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.4 }}>
            <Suspense fallback={<ScreenFallback />}>
              <TimelineScreen buildingId={selectedBuilding} onNavigate={setScreen} renderStartMs={timelineRenderStart.current} />
            </Suspense>
          </motion.div>
        )}
        {screen === "about" && (
          <motion.div key="about" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
            <Suspense fallback={<ScreenFallback />}>
              <AboutScreen onNavigate={setScreen} />
            </Suspense>
          </motion.div>
        )}
        {screen === "quest" && (
          <motion.div key="quest" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
            <Suspense fallback={<ScreenFallback />}>
              <QuestScreen onNavigate={setScreen} />
            </Suspense>
          </motion.div>
        )}
        {screen === "photohub" && (
          <motion.div key="photohub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
            <Suspense fallback={<ScreenFallback />}>
              <PhotoHubScreen onNavigate={setScreen} />
            </Suspense>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
