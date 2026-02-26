import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Check, QrCode } from "lucide-react";
import { buildings } from "@/data/geoTable";
import { useAppStore } from "@/store/appStore";
import type { Screen } from "@/pages/Index";

interface QuestScreenProps {
  onNavigate: (screen: Screen) => void;
}

const QuestScreen = ({ onNavigate }: QuestScreenProps) => {
  const { stamps, addStamp } = useAppStore();
  const [showQrInfo, setShowQrInfo] = useState(false);

  const questBuildings = buildings.slice(0, 12);

  // Simulate QR code scan awarding a random stamp
  const simulateQrScan = () => {
    const unvisited = questBuildings.filter((b) => !stamps.has(b.id));
    if (unvisited.length > 0) {
      const random = unvisited[Math.floor(Math.random() * unvisited.length)];
      addStamp(random.id);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-purple text-primary-foreground px-5 py-6">
        <button
          onClick={() => onNavigate("home")}
          className="flex items-center gap-2 text-sm opacity-80 hover:opacity-100 transition-opacity mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Home
        </button>
        <h1 className="text-3xl font-bold">Campus Stamp Quest</h1>
        <p className="text-sm opacity-80 mt-1">Visit buildings and collect stamps!</p>
      </div>

      {/* Progress */}
      <div className="px-5 py-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">Progress</span>
          <span className="text-sm font-bold text-primary">
            {stamps.size} / {questBuildings.length}
          </span>
        </div>
        <div className="h-3 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-gold"
            animate={{ width: `${(stamps.size / questBuildings.length) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      {/* QR Code scan button */}
      <div className="px-5 mb-4">
        <button
          onClick={simulateQrScan}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent text-accent-foreground font-semibold shadow-md hover:shadow-lg transition-all"
        >
          <QrCode className="w-5 h-5" />
          Scan QR Code
        </button>
        <button
          onClick={() => setShowQrInfo(!showQrInfo)}
          className="w-full mt-2 text-xs text-muted-foreground text-center underline"
        >
          How does QR scanning work?
        </button>
        {showQrInfo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-2 glass-card rounded-lg p-3 text-xs text-foreground/80"
          >
            <p>Visit campus buildings and scan the QR codes placed near each building entrance. Each scan unlocks a stamp for that building and shows you its history!</p>
            <p className="mt-1 text-muted-foreground italic">(Demo: tap "Scan QR Code" above to simulate a scan)</p>
          </motion.div>
        )}
      </div>

      {/* Stamp grid */}
      <div className="px-5 pb-8">
        <div className="grid grid-cols-3 gap-3">
          {questBuildings.map((building, i) => {
            const collected = stamps.has(building.id);
            return (
              <motion.div
                key={building.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className={`relative aspect-square rounded-xl flex flex-col items-center justify-center p-2 text-center transition-all ${
                  collected
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "bg-card text-foreground border border-border"
                }`}
              >
                {collected && (
                  <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                    <Check className="w-3 h-3 text-accent-foreground" />
                  </div>
                )}
                <span className="text-2xl mb-1">{collected ? "🏅" : "🏷️"}</span>
                <span className="text-[10px] font-medium leading-tight line-clamp-2">{building.name}</span>
              </motion.div>
            );
          })}
        </div>

        {stamps.size === questBuildings.length && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 glass-card rounded-xl p-5 text-center"
          >
            <span className="text-3xl">🎉</span>
            <h3 className="text-lg font-bold text-foreground mt-2">Quest Complete!</h3>
            <p className="text-sm text-muted-foreground">You've visited all campus locations!</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default QuestScreen;
