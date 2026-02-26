import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowLeft, MapPin, Camera, Check } from "lucide-react";
import { buildings, buildingContent } from "@/data/geoTable";
import { useAppStore } from "@/store/appStore";
import type { Screen } from "@/pages/Index";

interface TimelineScreenProps {
  buildingId: string;
  onNavigate: (screen: Screen) => void;
}

const TimelineScreen = ({ buildingId, onNavigate }: TimelineScreenProps) => {
  const building = buildings.find((b) => b.id === buildingId);
  const content = buildingContent[buildingId] || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const { stamps, addStamp, photos, addPhoto } = useAppStore();
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [photoAdded, setPhotoAdded] = useState(false);
  const [sampleContent, setSampleContent] = useState<Array<{ buildingName: string; year: number; description: string }>>([]);
  const [sampleLoading, setSampleLoading] = useState(false);
  const [sampleError, setSampleError] = useState<string | null>(null);

  const currentEntry = content[currentIndex];
  const hasPast = currentIndex > 0;
  const hasFuture = currentIndex < content.length - 1;
  const isStamped = stamps.has(buildingId);
  const buildingPhotos = photos.filter((p) => p.buildingId === buildingId);

  const yearProgress = useMemo(() => {
    if (content.length <= 1) return 100;
    return ((currentIndex) / (content.length - 1)) * 100;
  }, [currentIndex, content.length]);

  // Award stamp when viewing building
  useState(() => {
    if (buildingId && !isStamped) {
      addStamp(buildingId);
    }
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) {
      alert("File too large. Maximum 100MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoUpload = () => {
    if (!previewImage) return;
    addPhoto({
      buildingId,
      imageUrl: previewImage,
      caption: `Photo of ${building?.name || "building"}`,
    });
    setPreviewImage(null);
    setShowPhotoUpload(false);
    setPhotoAdded(true);
    setTimeout(() => setPhotoAdded(false), 3000);
  };

  useEffect(() => {
    let cancelled = false;
    const shouldLoadSample = !building || content.length === 0;
    if (!shouldLoadSample) return;

    setSampleLoading(true);
    setSampleError(null);

    fetch("/api/content/sample?limit=3")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load sample content");
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setSampleContent(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (cancelled) return;
        setSampleError("Unable to load sample history right now.");
      })
      .finally(() => {
        if (cancelled) return;
        setSampleLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [building, content.length]);

  if (!building || content.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
        <MapPin className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-2">No History Available</h2>
        <p className="text-muted-foreground mb-6 text-center">
          Historical content for this building is coming soon.
        </p>

        {sampleLoading && (
          <p className="text-sm text-muted-foreground mb-4">Loading sample history...</p>
        )}

        {!sampleLoading && sampleContent.length > 0 && (
          <div className="w-full max-w-xl mb-6">
            <h3 className="text-sm font-semibold text-foreground mb-3 text-center">Sample History</h3>
            <div className="space-y-3">
              {sampleContent.map((row, index) => (
                <div key={`${row.buildingName}-${row.year}-${index}`} className="rounded-lg border border-border p-3 bg-card">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {row.buildingName}
                    </span>
                    <span className="text-xs text-muted-foreground">• {row.year}</span>
                  </div>
                  <p className="text-sm text-foreground/90">{row.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {sampleError && (
          <p className="text-sm text-muted-foreground mb-4">{sampleError}</p>
        )}

        <button
          onClick={() => onNavigate("map")}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Map
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-gradient-purple text-primary-foreground px-4 py-5">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => onNavigate("map")}
            className="w-9 h-9 rounded-full bg-primary-foreground/15 flex items-center justify-center hover:bg-primary-foreground/25 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold leading-tight">{building.name}</h1>
            <p className="text-sm opacity-80">University of Portland</p>
          </div>
          {isStamped && (
            <span className="text-2xl" title="Stamp collected!">🏅</span>
          )}
        </div>

        {/* Timeline progress */}
        <div className="flex items-center gap-3">
          <span className="text-xs opacity-70">{content[0].year}</span>
          <div className="flex-1 h-1.5 rounded-full bg-primary-foreground/20 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-accent"
              animate={{ width: `${yearProgress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <span className="text-xs opacity-70">{content[content.length - 1].year}</span>
        </div>
      </div>

      {/* Stamp badge */}
      <div className="px-5 pt-4 text-center">
        <span className="text-sm font-semibold text-foreground">
          🏷️ Stamps collected: {stamps.size}
        </span>
      </div>

      {/* Content area */}
      <div className="flex-1 px-5 py-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-block px-4 py-2 rounded-lg bg-primary text-primary-foreground font-display text-2xl font-bold">
                {currentEntry.year}
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <p className="text-foreground/90 text-lg leading-relaxed font-body">
              {currentEntry.description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation buttons */}
      <div className="px-5 pb-4">
        <div className="flex gap-3">
          <button
            onClick={() => hasPast && setCurrentIndex(currentIndex - 1)}
            disabled={!hasPast}
            className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-semibold transition-all ${
              hasPast
                ? "bg-primary text-primary-foreground shadow-md hover:shadow-lg"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
            Past
          </button>
          <button
            onClick={() => hasFuture && setCurrentIndex(currentIndex + 1)}
            disabled={!hasFuture}
            className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-semibold transition-all ${
              hasFuture
                ? "bg-primary text-primary-foreground shadow-md hover:shadow-lg"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
          >
            Future
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Add Photo section */}
      <div className="px-5 pb-6">
        <div className="glass-card rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-bold text-foreground text-center">Add a Photo to this Building</h3>
          
          {!showPhotoUpload ? (
            <button
              onClick={() => setShowPhotoUpload(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm"
            >
              <Camera className="w-4 h-4" /> Add Photo
            </button>
          ) : (
            <div className="space-y-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="w-full text-xs text-foreground file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-primary file:text-primary-foreground"
              />
              {previewImage && (
                <img src={previewImage} alt="Preview" className="w-full max-h-40 object-cover rounded-lg" />
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowPhotoUpload(false); setPreviewImage(null); }}
                  className="flex-1 py-2 rounded-lg bg-muted text-muted-foreground text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePhotoUpload}
                  disabled={!previewImage}
                  className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
                >
                  Upload
                </button>
              </div>
            </div>
          )}

          {photoAdded && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center gap-2 text-sm text-primary font-medium"
            >
              <Check className="w-4 h-4" /> Photo Added!
            </motion.div>
          )}

          <p className="text-xs text-muted-foreground text-center">
            Photos Taken: {buildingPhotos.length}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TimelineScreen;
