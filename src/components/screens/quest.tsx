import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Check, QrCode, X } from "lucide-react";
import jsQR from "jsqr";
import { buildings } from "@/data/geoTable";
import { useAppStore } from "@/store/appStore";
import type { Screen } from "@/pages/Index";
import WallyStamp from "@/components/wally-stamp";

//test

interface QuestScreenProps {
  onNavigate: (screen: Screen) => void;
}

const QuestScreen = ({ onNavigate }: QuestScreenProps) => {
  const { stamps, addStamp } = useAppStore();
  const [showQrInfo, setShowQrInfo] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [manualQrValue, setManualQrValue] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<number | null>(null);
  const scanLockedRef = useRef(false);

  const questBuildings = buildings.slice(0, 12);
  const qrStampAliases: Record<string, string> = {
     "engineering-up-edu": "shiley",
      "sites-up-edu-museum-mago-hunt-center-50-years-of-the-arts": "mago",
      "portlandpilots-com-sports-2008-8-11-msoc-0811085954-aspx": "merlo",
      "ww1-up-edu-campusministry-chapels-bells-and-more-chapel-360-html": "chapel",
      "ww1-up-edu-facilitiesplanning-completed-projects-bauccio-commons-html": "commons",
      "www-up-edu-admissions-aid-visit-virtual-tours-map-and-directions-html": "waldschmidt",
      "ww1-up-edu-dbi": "db",
      "ww1-up-edu-facilitiesplanning-completed-projects-shileymarcos-html": "shiley-marcos",
      "www-up-edu-student-life-sports-and-fitness-recreational-services-court-reservations-and-fields-html": "fields",
      "www-up-edu-student-life-sports-and-fitness-recreational-services-beauchamp-center-index-html": "beauchamp",
      "ww1-up-edu-facilitiesplanning-completed-projects-chiles-center-expansion-html": "chiles",
      "ww1-up-edu-facilitiesplanning-completed-projects-joe-etzel-field-html": "baseball",
  };

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
    scanLockedRef.current = false;
    setScanning(false);
  };

  const handleScanValue = (value: string) => {
    if (scanLockedRef.current) return;
    setScanResult(value);
    const normalized = normalizeId(value);
    const aliasMatch = qrStampAliases[normalized];
    const match =
      (aliasMatch ? questBuildings.find((b) => b.id === aliasMatch) : undefined) ||
      questBuildings.find((b) => normalizeId(b.id) === normalized) ||
      questBuildings.find((b) => normalizeId(b.name) === normalized);

    if (match) {
      scanLockedRef.current = true;
      setScanError(null);
      addStamp(match.id);
      stopScanning();
      return;
    }

    setScanError("Valid QR code detected, but it is not one of the campus quest codes.");
  };

  const handleManualSubmit = () => {
    if (!manualQrValue.trim()) return;
    handleScanValue(manualQrValue.trim());
    setManualQrValue("");
  };

  useEffect(() => {
    if (!scanning) return;

    const start = async () => {
      setScanError(null);
      setScanResult(null);
      setManualQrValue("");
      scanLockedRef.current = false;

      if (!("mediaDevices" in navigator) || !navigator.mediaDevices.getUserMedia) {
        setScanError("Camera access is not supported in this browser. Paste the QR link below.");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.setAttribute("playsinline", "true");
          videoRef.current.muted = true;
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        scanTimerRef.current = window.setInterval(async () => {
          if (!videoRef.current || !canvasRef.current) return;
          const video = videoRef.current;
          const canvas = canvasRef.current;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          if (!canvas.width || !canvas.height) return;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          try {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "attemptBoth",
            });
            if (code?.data) {
              handleScanValue(code.data);
            }
          } catch {
            // ignore detection errors
          }
        }, 600);
      } catch {
        setScanError("Unable to access the camera. Check permissions or paste the QR link below.");
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
                <WallyStamp collected={collected} size="md" className="mb-2" />
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
              <div className="rounded-lg overflow-hidden border border-border">
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-64 object-cover" />
                <canvas ref={canvasRef} className="hidden" />
              </div>
              {scanResult && (
                <p className="text-xs text-muted-foreground">Scanned: {scanResult}</p>
              )}
              <div className="space-y-2 border-t border-border pt-3">
                <p className="text-xs text-muted-foreground">
                  If camera scanning does not work, paste the QR link here.
                </p>
                <input
                  type="text"
                  value={manualQrValue}
                  onChange={(e) => setManualQrValue(e.target.value)}
                  placeholder="https://scanned.page/p/qEK1lt"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground"
                />
                <button
                  onClick={handleManualSubmit}
                  disabled={!manualQrValue.trim()}
                  className="w-full py-2 rounded-lg bg-accent text-accent-foreground text-sm font-medium disabled:opacity-50"
                >
                  Redeem QR Link
                </button>
              </div>
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
