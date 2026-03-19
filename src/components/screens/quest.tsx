import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Check, QrCode, X } from "lucide-react";
import { buildings } from "@/data/geoTable";
import { useAppStore } from "@/store/appStore";
import type { Screen } from "@/pages/Index";

interface QuestScreenProps {
  onNavigate: (screen: Screen) => void;
}

const QuestScreen = ({ onNavigate }: QuestScreenProps) => {
  const { stamps, addStamp } = useAppStore();
  const [showQrInfo, setShowQrInfo] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<number | null>(null);

  const questBuildings = buildings.slice(0, 12);

  const normalizeId = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/https?:\/\//, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const stopScanning = () => {
    if (scanTimerRef.current !== null) {
      window.clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  const handleScanValue = (value: string) => {
    setScanResult(value);
    const normalized = normalizeId(value);
    const match =
      questBuildings.find((b) => normalizeId(b.id) === normalized) ||
      questBuildings.find((b) => normalizeId(b.name) === normalized);

    if (match) {
      addStamp(match.id);
    }
    stopScanning();
  };

  useEffect(() => {
    if (!scanning) return;

    const start = async () => {
      setScanError(null);
      setScanResult(null);

      if (!("mediaDevices" in navigator) || !navigator.mediaDevices.getUserMedia) {
        setScanError("Camera access is not supported in this browser.");
        setScanning(false);
        return;
      }

      if (!("BarcodeDetector" in window)) {
        setScanError("QR scanning is not supported in this browser.");
        setScanning(false);
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        const detector = new (window as typeof window & { BarcodeDetector: typeof BarcodeDetector }).BarcodeDetector({
          formats: ["qr_code"],
        });

        scanTimerRef.current = window.setInterval(async () => {
          if (!videoRef.current || !canvasRef.current) return;
          const video = videoRef.current;
          const canvas = canvasRef.current;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          try {
            const barcodes = await detector.detect(canvas);
            if (barcodes.length > 0 && barcodes[0].rawValue) {
              handleScanValue(barcodes[0].rawValue);
            }
          } catch {
            // ignore detection errors
          }
        }, 600);
      } catch {
        setScanError("Unable to access the camera. Check permissions.");
        setScanning(false);
      }
    };

    start();

    return () => {
      stopScanning();
    };
  }, [scanning, questBuildings]);

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
          onClick={() => setScanning(true)}
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
            <p className="mt-1 text-muted-foreground italic">(The scanner uses your device camera.)</p>
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

      {scanning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-xl bg-background border border-border overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="text-sm font-semibold text-foreground">Scan QR Code</div>
              <button
                onClick={stopScanning}
                className="p-2 rounded-full hover:bg-muted"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              {scanError && (
                <p className="text-xs text-muted-foreground">{scanError}</p>
              )}
              {!scanError && (
                <div className="rounded-lg overflow-hidden border border-border">
                  <video ref={videoRef} className="w-full h-64 object-cover" />
                  <canvas ref={canvasRef} className="hidden" />
                </div>
              )}
              {scanResult && (
                <p className="text-xs text-muted-foreground">Scanned: {scanResult}</p>
              )}
              <button
                onClick={stopScanning}
                className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestScreen;
