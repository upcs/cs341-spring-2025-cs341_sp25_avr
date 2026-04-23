import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Check, QrCode, X } from "lucide-react";
import jsQR from "jsqr";
import { buildings } from "@/data/buildings";
import { useAppStore } from "@/store/appStore";
import type { Screen } from "@/pages/Index";
import WallyStamp from "@/components/wally-stamp";

interface QuestScreenProps {
  onNavigate: (screen: Screen) => void;
}

const normalizeId = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/https?:\/\//, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

function buildAllowedQuestCodes(
  qrStampAliases: Record<string, string>
) {
  const allowedCodes = new Map<string, string>();

  const register = (rawValue: string, buildingId: string) => {
    const trimmed = rawValue.trim();
    if (!trimmed) return;
    allowedCodes.set(trimmed.toLowerCase(), buildingId);
    allowedCodes.set(normalizeId(trimmed), buildingId);
  };

  for (const [code, buildingId] of Object.entries(qrStampAliases)) {
    register(code, buildingId);
  }

  return allowedCodes;
}

const QuestScreen = ({ onNavigate }: QuestScreenProps) => {
  const { stamps, addStamp } = useAppStore();
  const [showQrInfo, setShowQrInfo] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanAttempt, setScanAttempt] = useState(0);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [scanSuccess, setScanSuccess] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanFrameRef = useRef<number | null>(null);
  const scanLockedRef = useRef(false);
  const barcodeDetectorRef = useRef<{ detect: (source: CanvasImageSource) => Promise<Array<{ rawValue?: string }>> } | null>(null);

  const questBuildings = buildings.slice(0, 12);
  const qrStampAliases: Record<string, string> = {
    "https://engineering.up.edu/": "shiley",
    "https://scanned.page/p/qEK1lt": "shiley",
    "http://scanned.page/p/qEK1lt": "shiley",
    "scanned.page/p/qEK1lt": "shiley",
    "scanned-page-p-qek1lt": "shiley",
    qek1lt: "shiley",
    "https://sites.up.edu/museum/mago-hunt-center-50-years-of-the-arts/": "mago",
    "https://portlandpilots.com/sports/2008/8/11/MSOC_0811085954.aspx": "merlo",
    "https://ww1.up.edu/campusministry/chapels-bells-and-more/chapel-360.html": "chapel",
    "https://ww1.up.edu/facilitiesplanning/completed-projects/bauccio-commons.html": "commons",
    "https://www.up.edu/admissions-aid/visit-virtual-tours/map-and-directions.html": "waldschmidt",
    "https://ww1.up.edu/dbi/": "db",
    "https://ww1.up.edu/facilitiesplanning/completed-projects/shileymarcos.html": "shiley-marcos",
    "https://www.up.edu/student-life/sports-and-fitness/recreational-services/court-reservations-and-fields.html": "fields",
    "https://www.up.edu/student-life/sports-and-fitness/recreational-services/beauchamp-center/index.html": "beauchamp",
    "https://ww1.up.edu/facilitiesplanning/completed-projects/chiles-center-expansion.html": "chiles",
    "https://ww1.up.edu/facilitiesplanning/completed-projects/joe-etzel-field.html": "baseball",
  };
  const allowedQuestCodes = useMemo(
    () => buildAllowedQuestCodes(qrStampAliases),
    []
  );

  const resetScanFeedback = () => {
    setScanError(null);
    setScanResult(null);
    setScanSuccess(null);
  };

  const teardownScanner = () => {
    if (scanFrameRef.current !== null) {
      window.cancelAnimationFrame(scanFrameRef.current);
      scanFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
      videoRef.current.removeAttribute("src");
    }
    scanLockedRef.current = false;
  };

  const stopScanning = () => {
    teardownScanner();
    setScanning(false);
  };

  const openScanner = () => {
    resetScanFeedback();
    setScanning(true);
    setScanAttempt((current) => current + 1);
  };

  const decodeCanvas = async (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
    if (!barcodeDetectorRef.current && "BarcodeDetector" in window) {
      try {
        const BarcodeDetectorCtor = (window as typeof window & {
          BarcodeDetector?: new (options?: { formats?: string[] }) => {
            detect: (source: CanvasImageSource) => Promise<Array<{ rawValue?: string }>>;
          };
        }).BarcodeDetector;

        if (BarcodeDetectorCtor) {
          barcodeDetectorRef.current = new BarcodeDetectorCtor({ formats: ["qr_code"] });
        }
      } catch {
        barcodeDetectorRef.current = null;
      }
    }

    if (barcodeDetectorRef.current) {
      try {
        const detected = await barcodeDetectorRef.current.detect(canvas);
        const rawValue = detected.find((entry) => entry.rawValue)?.rawValue;
        if (rawValue) {
          return rawValue;
        }
      } catch {
        // Fall through to jsQR.
      }
    }

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const qr = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "attemptBoth",
    });
    return qr?.data ?? null;
  };

  const handleScanValue = (value: string) => {
    if (scanLockedRef.current) return;
    setScanResult(value);
    const trimmedValue = value.trim();
    const matchedBuildingId =
      allowedQuestCodes.get(trimmedValue.toLowerCase()) ?? allowedQuestCodes.get(normalizeId(trimmedValue));
    const match = matchedBuildingId
      ? questBuildings.find((building) => building.id === matchedBuildingId)
      : undefined;

    if (match) {
      scanLockedRef.current = true;
      setScanError(null);
      setScanSuccess(`Unlocked ${match.name}`);
      addStamp(match.id);
      stopScanning();
      return true;
    }

    setScanSuccess(null);
    setScanError("Valid QR code detected, but it is not one of the campus quest codes.");
    return false;
  };

  useEffect(() => {
    if (!scanning) return;

    const start = async () => {
      resetScanFeedback();
      scanLockedRef.current = false;

      if (!("mediaDevices" in navigator) || !navigator.mediaDevices.getUserMedia) {
        setScanError("Camera access is not supported in this browser. You can only unlock badges by scanning a building QR code.");
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
        const video = videoRef.current;
        if (!video) {
          setScanError("Camera preview is unavailable. You can only unlock badges by scanning a building QR code.");
          return;
        }

        video.setAttribute("playsinline", "true");
        video.muted = true;
        video.srcObject = stream;
        video.load();

        await new Promise<void>((resolve) => {
          if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
            resolve();
            return;
          }

          const onLoaded = () => {
            video.removeEventListener("loadedmetadata", onLoaded);
            resolve();
          };

          video.addEventListener("loadedmetadata", onLoaded);
        });

        await video.play();

        const scanFrame = async () => {
          if (!videoRef.current || !canvasRef.current || scanLockedRef.current) return;

          const activeVideo = videoRef.current;
          if (activeVideo.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
            scanFrameRef.current = window.requestAnimationFrame(scanFrame);
            return;
          }

          const canvas = canvasRef.current;
          const ctx = canvas.getContext("2d");
          if (!ctx || !activeVideo.videoWidth || !activeVideo.videoHeight) {
            scanFrameRef.current = window.requestAnimationFrame(scanFrame);
            return;
          }

          canvas.width = activeVideo.videoWidth;
          canvas.height = activeVideo.videoHeight;
          ctx.drawImage(activeVideo, 0, 0, canvas.width, canvas.height);

          try {
            const code = await decodeCanvas(canvas, ctx);
            if (code) {
              const unlocked = handleScanValue(code);
              if (unlocked) {
                return;
              }
            }
          } catch {
            // Keep scanning if one frame cannot be decoded.
          }

          scanFrameRef.current = window.requestAnimationFrame(scanFrame);
        };

        scanFrameRef.current = window.requestAnimationFrame(scanFrame);
      } catch (error) {
        console.error("QR scanner failed to start", error);
        setScanError("Unable to access the camera. Check permissions and scan the building QR code with this device.");
      }
    };

    start();

    return () => {
      teardownScanner();
    };
  }, [scanning, scanAttempt, questBuildings]);

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
        {scanSuccess && (
          <div className="mb-3 rounded-xl bg-accent/15 border border-accent/40 px-4 py-3 text-sm font-medium text-foreground">
            {scanSuccess}
          </div>
        )}
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
          onClick={openScanner}
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

      <div className="px-5 mb-5">
        <div className="glass-card rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-foreground">Scan Required</p>
          <p className="text-xs text-muted-foreground">
            Badge progress always starts at zero and only unlocks when you scan a valid building QR code with the in-app camera.
          </p>
          {scanError && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-foreground">
              {scanError}
            </p>
          )}
          {scanResult && !scanError && !scanSuccess && (
            <p className="text-xs text-muted-foreground">Scanned: {scanResult}</p>
          )}
        </div>
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
                  Badges only unlock when the in-app camera scans a valid building QR code.
                </p>
                <button
                  onClick={openScanner}
                  className="w-full py-2 rounded-lg border border-border text-sm font-medium text-foreground"
                >
                  Restart Scanner
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
