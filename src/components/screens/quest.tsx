import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Check, QrCode, X } from "lucide-react";
import jsQR from "jsqr";
import { buildings } from "@/data/geoTable";
import { useAppStore } from "@/store/appStore";
import type { Screen } from "@/pages/Index";
import WallyStamp from "@/components/wally-stamp";

interface QuestScreenProps {
  onNavigate: (screen: Screen) => void;
}

const QuestScreen = ({ onNavigate }: QuestScreenProps) => {
  const { stamps, addStamp } = useAppStore();
  const [showQrInfo, setShowQrInfo] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [scanSuccess, setScanSuccess] = useState<string | null>(null);
  const [manualQrValue, setManualQrValue] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanFrameRef = useRef<number | null>(null);
  const scanLockedRef = useRef(false);
  const barcodeDetectorRef = useRef<{ detect: (source: CanvasImageSource) => Promise<Array<{ rawValue?: string }>> } | null>(null);

  const questBuildings = buildings.slice(0, 12);
  const qrStampAliases: Record<string, string> = {
    "scanned-page-p-qek1lt": "shiley",
    qek1lt: "shiley",
    shiley: "shiley",
    "shiley-school-of-engineering": "shiley",
  };

  const normalizeId = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/https?:\/\//, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const stopScanning = () => {
    if (scanFrameRef.current !== null) {
      window.cancelAnimationFrame(scanFrameRef.current);
      scanFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    scanLockedRef.current = false;
    setScanning(false);
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
    const normalized = normalizeId(value);
    const rawLower = value.toLowerCase().trim();
    const candidateKeys = new Set<string>([normalized, rawLower]);

    try {
      const url = new URL(value);
      candidateKeys.add(normalizeId(url.href));
      candidateKeys.add(normalizeId(url.hostname));
      candidateKeys.add(normalizeId(url.pathname));
      candidateKeys.add(normalizeId(url.search));
      candidateKeys.add(normalizeId(url.hash));
      url.pathname
        .split("/")
        .filter(Boolean)
        .forEach((segment) => candidateKeys.add(normalizeId(segment)));
      url.searchParams.forEach((paramValue, key) => {
        candidateKeys.add(normalizeId(key));
        candidateKeys.add(normalizeId(paramValue));
      });
    } catch {
      // Non-URL QR values are still valid candidates.
    }

    const aliasMatch = Array.from(candidateKeys)
      .map((key) => qrStampAliases[key])
      .find(Boolean);

    const match =
      (aliasMatch ? questBuildings.find((b) => b.id === aliasMatch) : undefined) ||
      questBuildings.find((b) => Array.from(candidateKeys).some((key) => key.includes(normalizeId(b.id)))) ||
      questBuildings.find((b) => Array.from(candidateKeys).some((key) => key.includes(normalizeId(b.name))));

    if (match) {
      scanLockedRef.current = true;
      setScanError(null);
      setScanSuccess(`Unlocked ${match.name}`);
      addStamp(match.id);
      stopScanning();
      return;
    }

    setScanSuccess(null);
    setScanError("Valid QR code detected, but it is not one of the campus quest codes.");
  };

  const handleManualSubmit = () => {
    if (!manualQrValue.trim()) return;
    handleScanValue(manualQrValue.trim());
    setManualQrValue("");
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const imageUrl = URL.createObjectURL(file);
      const image = new Image();

      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("load failed"));
        image.src = imageUrl;
      });

      const canvas = canvasRef.current;
      if (!canvas) {
        URL.revokeObjectURL(imageUrl);
        setScanError("Scanner canvas is unavailable. Try the camera or paste the QR link.");
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(imageUrl);
        setScanError("Unable to read the uploaded image. Try a clearer QR image.");
        return;
      }

      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      const code = await decodeCanvas(canvas, ctx);
      URL.revokeObjectURL(imageUrl);

      if (code) {
        handleScanValue(code);
        return;
      }

      setScanError("No QR code was detected in that image. Try a sharper image or paste the link.");
    } catch {
      setScanError("Unable to read the uploaded image. Try a different QR photo.");
    }
  };

  useEffect(() => {
    if (!scanning) return;

    const start = async () => {
      setScanError(null);
      setScanResult(null);
      setScanSuccess(null);
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
        const video = videoRef.current;
        if (!video) {
          setScanError("Camera preview is unavailable. Try uploading a QR image instead.");
          return;
        }

        video.setAttribute("playsinline", "true");
        video.muted = true;
        video.srcObject = stream;

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
              handleScanValue(code);
              return;
            }
          } catch {
            // Keep scanning if one frame cannot be decoded.
          }

          scanFrameRef.current = window.requestAnimationFrame(scanFrame);
        };

        scanFrameRef.current = window.requestAnimationFrame(scanFrame);
      } catch (error) {
        console.error("QR scanner failed to start", error);
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

      <div className="px-5 mb-5">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleImageUpload}
          className="hidden"
        />
        <div className="glass-card rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-foreground">Manual QR fallback</p>
          <p className="text-xs text-muted-foreground">
            If camera scanning is unavailable, upload a QR image or paste the campus QR link here.
          </p>
          {scanError && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-foreground">
              {scanError}
            </p>
          )}
          {scanResult && !scanError && !scanSuccess && (
            <p className="text-xs text-muted-foreground">Scanned: {scanResult}</p>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2 rounded-lg border border-border text-sm font-medium text-foreground"
          >
            Upload QR Image
          </button>
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
                  If camera scanning does not work, you can also use the manual fallback on the main quest screen.
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2 rounded-lg border border-border text-sm font-medium text-foreground"
                >
                  Upload QR Image
                </button>
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
