import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowLeft, MapPin, X } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { buildings, buildingContent } from "@/data/geoTable";
import { useAppStore } from "@/store/appStore";
import type { Screen } from "@/pages/Index";

interface TimelineScreenProps {
  buildingId: string;
  onNavigate: (screen: Screen) => void;
}

const TimelineScreen = ({ buildingId, onNavigate }: TimelineScreenProps) => {
  const building = buildings.find((b) => b.id === buildingId);
  const localContent = buildingContent[buildingId] || [];
  const [dbTimeline, setDbTimeline] = useState<Array<{ year: number; description: string }>>([]);
  const [dbTimelineLoading, setDbTimelineLoading] = useState(false);
  const [dbTimelineError, setDbTimelineError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { stamps, addStamp } = useAppStore();
  const [sampleContent, setSampleContent] = useState<Array<{ buildingName: string; year: number; description: string }>>([]);
  const [sampleLoading, setSampleLoading] = useState(false);
  const [sampleError, setSampleError] = useState<string | null>(null);
  const [dbPhotos, setDbPhotos] = useState<Array<{ buildingName: string; year: number; caption: string; imageUrl: string }>>([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [photosError, setPhotosError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<{ imageUrl: string; caption: string; buildingName: string; year: number } | null>(null);
  const [showAddPhoto, setShowAddPhoto] = useState(false);
  const [photoForm, setPhotoForm] = useState({ caption: "", year: "" });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoSubmitting, setPhotoSubmitting] = useState(false);
  const [photoSubmitError, setPhotoSubmitError] = useState<string | null>(null);
  const [photoSubmitSuccess, setPhotoSubmitSuccess] = useState(false);
  const [photoStats, setPhotoStats] = useState<Array<{ buildingName: string; count: number }>>([]);
  const [photoStatsLoading, setPhotoStatsLoading] = useState(false);
  const [photoStatsError, setPhotoStatsError] = useState<string | null>(null);

  const effectiveContent = dbTimeline.length > 0 ? dbTimeline : localContent;
  const currentEntry = effectiveContent[currentIndex];
  const hasPast = currentIndex > 0;
  const hasFuture = currentIndex < effectiveContent.length - 1;
  const isStamped = stamps.has(buildingId);

  const yearProgress = useMemo(() => {
    if (effectiveContent.length <= 1) return 100;
    return ((currentIndex) / (effectiveContent.length - 1)) * 100;
  }, [currentIndex, effectiveContent.length]);

  // Award stamp when viewing building
  useState(() => {
    if (buildingId && !isStamped) {
      addStamp(buildingId);
    }
  });

  useEffect(() => {
    let cancelled = false;
    const shouldLoadSample = !building || (localContent.length === 0 && dbTimeline.length === 0);
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
  }, [building, localContent.length, dbTimeline.length]);

  useEffect(() => {
    let cancelled = false;
    if (!buildingId) return;

    setDbTimelineLoading(true);
    setDbTimelineError(null);

    fetch(`/api/content/by-building?buildingName=${encodeURIComponent(buildingId)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load building timeline");
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        const normalized = Array.isArray(data)
          ? data.map((row) => ({
              year: Number(row.year),
              description: String(row.description || ""),
            }))
          : [];
        setDbTimeline(normalized);
        setCurrentIndex(0);
      })
      .catch(() => {
        if (cancelled) return;
        setDbTimelineError("Unable to load timeline from database.");
      })
      .finally(() => {
        if (cancelled) return;
        setDbTimelineLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [buildingId]);

  const loadPhotos = () => {
    let cancelled = false;
    const buildingQuery = buildingId ? `&buildingName=${encodeURIComponent(buildingId)}` : "";

    setPhotosLoading(true);
    setPhotosError(null);

    fetch(`/api/content/photos?limit=12${buildingQuery}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load photos");
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setDbPhotos(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (cancelled) return;
        setPhotosError("Unable to load photos right now.");
      })
      .finally(() => {
        if (cancelled) return;
        setPhotosLoading(false);
      });

    return () => {
      cancelled = true;
    };
  };

  useEffect(() => {
    return loadPhotos();
  }, [buildingId]);

  useEffect(() => {
    let cancelled = false;
    setPhotoStatsLoading(true);
    setPhotoStatsError(null);

    fetch("/api/content/photos/stats")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load stats");
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        const normalized = Array.isArray(data)
          ? data.map((row) => ({
              buildingName: row.buildingName,
              count: Number(row.count) || 0,
            }))
          : [];
        setPhotoStats(normalized);
      })
      .catch(() => {
        if (cancelled) return;
        setPhotoStatsError("Unable to load photo stats.");
      })
      .finally(() => {
        if (cancelled) return;
        setPhotoStatsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handlePhotoSubmit = async () => {
    if (!buildingId) return;
    if (!photoFile) {
      setPhotoSubmitError("Photo file is required.");
      return;
    }

    setPhotoSubmitting(true);
    setPhotoSubmitError(null);
    setPhotoSubmitSuccess(false);

    try {
      const formData = new FormData();
      formData.append("buildingName", buildingId);
      if (photoForm.year) formData.append("year", photoForm.year);
      if (photoForm.caption) formData.append("caption", photoForm.caption);
      formData.append("photo", photoFile);

      const res = await fetch("/api/content/photos/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to add photo");

      setPhotoForm({ caption: "", year: "" });
      setPhotoFile(null);
      setPhotoSubmitSuccess(true);
      setShowAddPhoto(false);
      loadPhotos();
      setTimeout(() => setPhotoSubmitSuccess(false), 2000);
    } catch {
      setPhotoSubmitError("Unable to add photo right now.");
    } finally {
      setPhotoSubmitting(false);
    }
  };

  if (!building || effectiveContent.length === 0) {
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

        {photosLoading && (
          <p className="text-sm text-muted-foreground mb-4">Loading photos...</p>
        )}

        {!photosLoading && dbPhotos.length > 0 && (
          <div className="w-full max-w-xl mb-6">
            <h3 className="text-sm font-semibold text-foreground mb-3 text-center">Sample Photos</h3>
            <div className="grid grid-cols-2 gap-3">
              {dbPhotos.map((photo, index) => (
                <button
                  key={`${photo.buildingName}-${photo.year}-${index}`}
                  onClick={() => setSelectedPhoto({ ...photo })}
                  className="rounded-lg overflow-hidden border border-border bg-card text-left"
                >
                  <img src={photo.imageUrl} alt={photo.caption || "Building photo"} className="w-full h-32 object-cover" />
                  <div className="p-2">
                    <p className="text-xs text-muted-foreground">
                      {photo.buildingName} • {photo.year}
                    </p>
                    <p className="text-xs text-foreground/90 line-clamp-2">{photo.caption}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {photosError && (
          <p className="text-sm text-muted-foreground mb-4">{photosError}</p>
        )}

        <div className="w-full max-w-xl mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-3 text-center">Archive Insights</h3>
          {photoStatsLoading && (
            <p className="text-sm text-muted-foreground text-center">Loading photo stats...</p>
          )}
          {!photoStatsLoading && photoStats.length > 0 && (
            <div className="h-56 w-full rounded-lg border border-border bg-card p-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={photoStats}>
                  <XAxis dataKey="buildingName" tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          {photoStatsError && (
            <p className="text-sm text-muted-foreground text-center">{photoStatsError}</p>
          )}
        </div>

        {sampleError && (
          <p className="text-sm text-muted-foreground mb-4">{sampleError}</p>
        )}

        {dbTimelineError && (
          <p className="text-sm text-muted-foreground mb-4">{dbTimelineError}</p>
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
          <span className="text-xs opacity-70">{effectiveContent[0].year}</span>
          <div className="flex-1 h-1.5 rounded-full bg-primary-foreground/20 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-accent"
              animate={{ width: `${yearProgress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <span className="text-xs opacity-70">{effectiveContent[effectiveContent.length - 1].year}</span>
        </div>
      </div>

      {/* Stamp badge */}
      <div className="px-5 pt-4 text-center">
        <span className="text-sm font-semibold text-foreground">
          🏷️ Stamps collected: {stamps.size}
        </span>
        {dbTimelineLoading && (
          <div className="text-xs text-muted-foreground mt-1">Loading timeline from database...</div>
        )}
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
              {currentEntry?.year}
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <p className="text-foreground/90 text-lg leading-relaxed font-body">
              {currentEntry?.description}
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

      {/* Archive insights */}
      <div className="px-5 pb-4">
        <div className="glass-card rounded-xl p-4">
          <h3 className="text-sm font-bold text-foreground text-center mb-3">Archive Insights</h3>
          {photoStatsLoading && (
            <p className="text-xs text-muted-foreground text-center">Loading photo stats...</p>
          )}
          {!photoStatsLoading && photoStats.length > 0 && (
            <div className="h-56 w-full rounded-lg border border-border bg-card p-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={photoStats}>
                  <XAxis dataKey="buildingName" tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          {photoStatsError && (
            <p className="text-xs text-muted-foreground text-center">{photoStatsError}</p>
          )}
        </div>
      </div>

      {/* Add Photo section */}
      <div className="px-5 pb-6">
        <div className="glass-card rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-bold text-foreground text-center">Photos from the Archive</h3>

          {photosLoading && (
            <p className="text-xs text-muted-foreground text-center">Loading photos...</p>
          )}

          {!photosLoading && dbPhotos.length === 0 && (
            <p className="text-xs text-muted-foreground text-center">
              No archived photos found for this building.
            </p>
          )}

          {!photosLoading && dbPhotos.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {dbPhotos.map((photo, index) => (
                <button
                  key={`${photo.buildingName}-${photo.year}-${index}`}
                  onClick={() => setSelectedPhoto({ ...photo })}
                  className="rounded-lg overflow-hidden border border-border bg-card"
                >
                  <img src={photo.imageUrl} alt={photo.caption || "Building photo"} className="w-full h-24 object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className="pt-2">
            {!showAddPhoto ? (
              <button
                onClick={() => setShowAddPhoto(true)}
                className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
              >
                Add Photo
              </button>
            ) : (
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground"
                />
                <input
                  type="text"
                  placeholder="Caption (optional)"
                  value={photoForm.caption}
                  onChange={(e) => setPhotoForm((p) => ({ ...p, caption: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground"
                />
                <input
                  type="number"
                  placeholder="Year (optional)"
                  value={photoForm.year}
                  onChange={(e) => setPhotoForm((p) => ({ ...p, year: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground"
                />
                {photoSubmitError && (
                  <p className="text-xs text-muted-foreground">{photoSubmitError}</p>
                )}
                {photoSubmitSuccess && (
                  <p className="text-xs text-primary">Photo added.</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAddPhoto(false)}
                    className="flex-1 py-2 rounded-lg bg-muted text-muted-foreground text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePhotoSubmit}
                    disabled={photoSubmitting}
                    className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50"
                  >
                    {photoSubmitting ? "Adding..." : "Save"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="max-w-3xl w-full bg-background rounded-xl overflow-hidden border border-border">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="text-sm text-muted-foreground">
                {selectedPhoto.buildingName} • {selectedPhoto.year}
              </div>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="p-2 rounded-full hover:bg-muted"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <img
              src={selectedPhoto.imageUrl}
              alt={selectedPhoto.caption || "Building photo"}
              className="w-full max-h-[70vh] object-contain bg-black"
            />
            {selectedPhoto.caption && (
              <div className="px-4 py-3 text-sm text-foreground/90">{selectedPhoto.caption}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TimelineScreen;
