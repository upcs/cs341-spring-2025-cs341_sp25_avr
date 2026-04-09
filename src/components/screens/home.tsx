import { motion } from "framer-motion";
import { MapPin, Info, Trophy, Camera } from "lucide-react";
import type { Screen } from "@/pages/Index";
import { useAppStore } from "@/store/appStore";
import { buildings } from "@/data/geoTable";
import { useRef } from "react";

// Directs you to photo hub, map or timeline

interface HomeScreenProps {
  onNavigate: (screen: Screen) => void;
}

const HomeScreen = ({ onNavigate }: HomeScreenProps) => {
  const { stamps } = useAppStore();
  const questBuildings = buildings.slice(0, 12);

  // Performance testing
  const startTimeRef = useRef(performance.now());
  const hasLogged = useRef(false);

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

      {/* Stamp sidebar (left) - matches mockup with ? stamps on left */}
      <div className="relative z-10 flex flex-col gap-2 py-4 pl-2 pr-1">
        {questBuildings.slice(0, 8).map((b) => {
          const collected = stamps.has(b.id);
          return (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shadow-md cursor-pointer transition-all ${
                collected
                  ? "bg-accent text-accent-foreground"
                  : "bg-foreground/40 text-primary-foreground/80 backdrop-blur-sm"
              }`}
              title={b.name}
              onClick={() => onNavigate("quest")}
            >
              {collected ? "🏅" : "?"}
            </motion.div>
          );
        })}
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 max-w-lg mx-auto">
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

          // Performance testing
          onAnimationComplete={logPerformance}
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
      </div>
    </div>
  );
};

export default HomeScreen;
