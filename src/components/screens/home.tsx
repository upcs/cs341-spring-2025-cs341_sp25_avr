import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Info, Trophy, Camera } from "lucide-react";
import type { Screen } from "@/pages/Index";
import { useAppStore } from "@/store/appStore";
import { buildings } from "@/data/geoTable";
import WallyStamp from "@/components/wally-stamp";
import { recordElapsedMetric } from "@/lib/performance";


interface HomeScreenProps {
  onNavigate: (screen: Screen) => void;
}

const HomeScreen = ({ onNavigate }: HomeScreenProps) => {
  const { stamps } = useAppStore();
  const questBuildings = buildings.slice(0, 12);
  const [showBadgePanel, setShowBadgePanel] = useState(false);
  const collectedCount = questBuildings.filter((building) => stamps.has(building.id)).length;
  const completionPercent = questBuildings.length === 0 ? 0 : (collectedCount / questBuildings.length) * 100;
  const badgeRows = useMemo(
    () =>
      questBuildings.map((building) => ({
        ...building,
        collected: stamps.has(building.id),
      })),
    [questBuildings, stamps]
  );

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      recordElapsedMetric("home-screen-initial-render", 0, "Measured from page navigation start");
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="relative min-h-screen flex overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 overflow-hidden">
        <iframe
          src="https://www.youtube.com/embed/J9L0TJyOVYI?autoplay=1&mute=1&loop=1&playlist=J9L0TJyOVYI&controls=0&showinfo=0&modestbranding=1&start=66&playsinline=1"
          title="Campus video background"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300%] h-[300%] md:w-[200%] md:h-[200%] pointer-events-none"
          allow="autoplay; encrypted-media"
          frameBorder="0"
        />
        <div className="absolute inset-0 bg-gradient-purple opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.6 }}
        className="absolute left-4 top-5 z-20 w-[min(calc(100vw-2rem),34rem)] sm:left-5"
        onMouseEnter={() => setShowBadgePanel(true)}
        onMouseLeave={() => setShowBadgePanel(false)}
      >
        <div
          tabIndex={0}
          onFocus={() => setShowBadgePanel(true)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
              setShowBadgePanel(false);
            }
          }}
          className="rounded-2xl border border-primary-foreground/25 bg-primary-foreground/14 px-4 py-3 text-primary-foreground backdrop-blur-md shadow-xl outline-none"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="text-left">
              <p className="text-[10px] uppercase tracking-[0.22em] text-primary-foreground/65">Campus Quest Progress</p>
              <p className="mt-1 text-sm font-semibold">
                {collectedCount} of {questBuildings.length} badges collected
              </p>
            </div>
            <button
              onClick={() => onNavigate("quest")}
              className="shrink-0 rounded-full border border-primary-foreground/20 bg-primary-foreground/12 px-3 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary-foreground/22"
            >
              Open Quest
            </button>
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-primary-foreground/18">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-500 ease-out"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
          <p className="mt-2 text-left text-xs text-primary-foreground/72">
            Hover or focus to preview every badge, including the ones you still need.
          </p>
        </div>

        {showBadgePanel && (
          <div className="mt-3 rounded-3xl border border-primary-foreground/20 bg-background/95 p-4 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Badge Overview</p>
                <p className="mt-1 text-sm font-semibold text-foreground">Collected and remaining campus stamps</p>
              </div>
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground">
                {Math.round(completionPercent)}%
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {badgeRows.map((building) => (
                <div
                  key={building.id}
                  className={`flex items-center gap-3 rounded-2xl border px-3 py-2 ${
                    building.collected
                      ? "border-accent/40 bg-accent/10"
                      : "border-border bg-muted/35"
                  }`}
                >
                  <WallyStamp collected={building.collected} size="sm" />
                  <div className="min-w-0 text-left">
                    <p className="text-xs font-semibold text-foreground line-clamp-2">{building.name}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {building.collected ? "Collected" : "Incomplete"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-10 pt-32 text-center max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="mb-2"
        >
          <span className="inline-block px-4 py-1.5 rounded-full text-sm font-medium bg-accent/20 text-primary-foreground backdrop-blur-sm border border-primary-foreground/20">
            Est. 1901
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-5xl md:text-6xl font-bold text-primary-foreground leading-tight mb-3"
        >
          125th Anniversary
          <br />
          <span className="italic font-normal text-4xl md:text-5xl opacity-90">Time Machine</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="text-primary-foreground/80 text-lg mb-8 max-w-sm"
        >
          Explore the rich history of the University of Portland campus
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="flex flex-col gap-3 w-full max-w-xs"
        >
          <button
            onClick={() => onNavigate("map")}
            className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-primary-foreground text-primary font-semibold text-lg shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <MapPin className="w-5 h-5" />
            Start
          </button>

          <button
            onClick={() => onNavigate("photohub")}
            className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-accent text-accent-foreground font-semibold shadow-md hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Camera className="w-5 h-5" />
            Photo Hub
          </button>

          <button
            onClick={() => onNavigate("quest")}
            className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-primary-foreground/15 text-primary-foreground font-medium backdrop-blur-sm border border-primary-foreground/25 hover:bg-primary-foreground/25 transition-all"
          >
            <Trophy className="w-5 h-5" />
            Campus Quest
          </button>

          <button
            onClick={() => onNavigate("about")}
            className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-primary-foreground/15 text-primary-foreground font-medium backdrop-blur-sm border border-primary-foreground/25 hover:bg-primary-foreground/25 transition-all"
          >
            <Info className="w-5 h-5" />
            About
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.6 }}
          className="mt-6 w-full max-w-xs rounded-2xl border border-primary-foreground/20 bg-primary-foreground/12 p-4 text-left backdrop-blur-sm"
        >
          <p className="text-xs uppercase tracking-[0.18em] text-primary-foreground/70">Support The Archive</p>
          <p className="mt-2 text-sm text-primary-foreground/90">
            Preview the archive supporter tiers and sponsorship idea for the release candidate.
          </p>
          <button
            onClick={() => onNavigate("about")}
            className="mt-3 w-full rounded-xl bg-primary-foreground px-4 py-2 text-sm font-semibold text-primary"
          >
            Preview Support Plans
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default HomeScreen;
