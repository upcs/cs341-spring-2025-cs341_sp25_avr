import { useEffect, useMemo, useRef, useState, type SyntheticEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowLeft, MapPin, X } from "lucide-react";
import { archivePhotos, buildings, buildingContent, resolveDisplayImagePath } from "@/data/geoTable";
import { useAuth } from "@/components/auth-context";
import type { Screen } from "@/pages/Index";
import { recordElapsedMetric } from "@/lib/performance";

interface TimelineScreenProps {
  buildingId: string;
  onNavigate: (screen: Screen) => void;
  renderStartMs?: number | null;
}

type TimelineEntry = {
  year: number;
  description: string;
  imagePath?: string;
};

type PhotoEntry = {
  id: string;
  buildingName: string;
  year: number;
  caption: string;
  imageUrl: string;
};

type TimelineVisual = {
  imageUrl: string;
  caption: string;
  year: number;
  exactYear: boolean;
  fallback?: boolean;
};

const FALLBACK_IMAGE_URL = "/placeholder.svg";
const DEFAULT_TIMELINE_IMAGE_URL = "/images/up-campus.jpg";
const BUILDING_TIMELINE_FALLBACK_IMAGES: Record<string, string> = {
  chapel: "/images/chapel-doors.jpg",
  franz: "/images/franz-hall.jpg",
  waldschmidt: "/images/waldschmidt-hall.jpg",
};

function normalizeBuildingKey(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function resolveBuildingFromInput(rawBuildingId: string) {
  const normalized = normalizeBuildingKey(rawBuildingId);
  if (!normalized) return undefined;

  const directMatch =
    buildings.find((candidate) => candidate.id === rawBuildingId || candidate.name === rawBuildingId) ||
    buildings.find(
      (candidate) =>
        normalizeBuildingKey(candidate.id) === normalized || normalizeBuildingKey(candidate.name) === normalized
    );

  if (directMatch) {
    return directMatch;
  }

  return buildings.find((candidate) => {
    const idKey = normalizeBuildingKey(candidate.id);
    const nameKey = normalizeBuildingKey(candidate.name);
    return (
      normalized.includes(idKey) ||
      normalized.includes(nameKey) ||
      idKey.includes(normalized) ||
      nameKey.includes(normalized)
    );
  });
}

function resolveTimelineVisual(
  buildingId: string | undefined,
  entry: TimelineEntry | undefined,
  photos: PhotoEntry[]
): TimelineVisual | null {
  if (!entry) {
    return null;
  }

  if (!buildingId) {
    const imageUrl = resolveDisplayImagePath(entry.imagePath);
    if (imageUrl) {
      return {
        imageUrl,
        caption: `Archive image for ${entry.year}`,
        year: entry.year,
        exactYear: true,
      };
    }
    return null;
  }

  const entryImageUrl = resolveDisplayImagePath(entry.imagePath);
  if (entryImageUrl) {
    return {
      imageUrl: entryImageUrl,
      caption: `Archive image for ${entry.year}`,
      year: entry.year,
      exactYear: true,
    };
  }

  const curatedExactMatch = archivePhotos.find((photo) => photo.buildingId === buildingId && photo.year === entry.year);
  if (curatedExactMatch) {
    return {
      imageUrl: curatedExactMatch.imageUrl,
      caption: curatedExactMatch.caption,
      year: curatedExactMatch.year,
      exactYear: true,
    };
  }

  const uploadedMatch = photos
    .filter((photo) => photo.buildingName && resolveBuildingFromInput(photo.buildingName)?.id === buildingId)
    .sort((a, b) => Math.abs(a.year - entry.year) - Math.abs(b.year - entry.year))[0];

  if (uploadedMatch) {
    return {
      imageUrl: uploadedMatch.imageUrl,
      caption: uploadedMatch.caption,
      year: uploadedMatch.year,
      exactYear: uploadedMatch.year === entry.year,
    };
  }

  const curatedMatch = archivePhotos
    .filter((photo) => photo.buildingId === buildingId)
    .sort((a, b) => Math.abs(a.year - entry.year) - Math.abs(b.year - entry.year))[0];

  if (!curatedMatch) {
    return null;
  }

  return {
    imageUrl: curatedMatch.imageUrl,
    caption: curatedMatch.caption,
    year: curatedMatch.year,
    exactYear: curatedMatch.year === entry.year,
  };
}

function buildTimelineVisualCandidates(
  buildingId: string | undefined,
  entry: TimelineEntry | undefined,
  photos: PhotoEntry[]
): TimelineVisual[] {
  const candidates: TimelineVisual[] = [];
  const seen = new Set<string>();

  const pushCandidate = (candidate: TimelineVisual | null) => {
    if (!candidate) return;
    const key = `${candidate.imageUrl}|${candidate.year}|${candidate.caption}`;
    if (seen.has(key)) return;
    seen.add(key);
    candidates.push(candidate);
  };

  pushCandidate(resolveTimelineVisual(buildingId, entry, photos));

  if (buildingId && entry) {
    photos
      .filter((photo) => photo.buildingName && resolveBuildingFromInput(photo.buildingName)?.id === buildingId)
      .sort((a, b) => Math.abs(a.year - entry.year) - Math.abs(b.year - entry.year))
      .forEach((photo) =>
        pushCandidate({
          imageUrl: photo.imageUrl,
          caption: photo.caption,
          year: photo.year,
          exactYear: photo.year === entry.year,
        })
      );

    const entryImageUrl = resolveDisplayImagePath(entry.imagePath);
    if (entryImageUrl) {
      pushCandidate({
        imageUrl: entryImageUrl,
        caption: `Archive image for ${entry.year}`,
        year: entry.year,
        exactYear: true,
      });
    }

    archivePhotos
      .filter((photo) => photo.buildingId === buildingId)
      .sort((a, b) => Math.abs(a.year - entry.year) - Math.abs(b.year - entry.year))
      .forEach((photo) =>
        pushCandidate({
          imageUrl: photo.imageUrl,
          caption: photo.caption,
          year: photo.year,
          exactYear: photo.year === entry.year,
        })
      );
  }

  return candidates;
}

function buildTimelineFallbackVisual(
  building: (typeof buildings)[number] | undefined,
  entry: TimelineEntry | undefined
): TimelineVisual | null {
  if (!entry) return null;

  const imageUrl = resolveDisplayImagePath(
    (building?.id && BUILDING_TIMELINE_FALLBACK_IMAGES[building.id]) || DEFAULT_TIMELINE_IMAGE_URL
  );

  return {
    imageUrl: imageUrl ?? FALLBACK_IMAGE_URL,
    caption: building ? `${building.name} campus view` : "University of Portland campus view",
    year: entry.year,
    exactYear: false,
    fallback: true,
  };
}

function buildFallbackTimelineEntries(
  building: (typeof buildings)[number] | undefined,
  localContent: TimelineEntry[]
): TimelineEntry[] {
  if (localContent.length > 0) {
    return localContent;
  }

  if (!building) {
    return [];
  }

  const derivedDescription = building.description
    ? `${building.description}${building.year ? "" : " Historical notes are currently using the campus catalog summary while fuller archive entries are added."}`
    : "Historical notes for this building are being expanded from the campus archive.";

  return [
    {
      year: building.year ?? 1901,
      description: derivedDescription,
    },
  ];
}

async function fetchTimelineEntries(buildingId: string | undefined, buildingName: string): Promise<TimelineEntry[]> {
  const params = new URLSearchParams({ buildingName });
  if (buildingId) {
    params.set("buildingId", buildingId);
  }

  const response = await fetch(`/api/content/by-building?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to load timeline");
  }

  const data = await response.json();
  if (!Array.isArray(data)) return [];

  return data
    .map((entry: { year?: number; description?: string; imagePath?: string }) => {
      const imagePath = resolveDisplayImagePath(entry.imagePath);
      return {
        year: Number(entry.year) || 0,
        description: entry.description || "",
        imagePath: imagePath ?? undefined,
      };
    })
    .sort((a, b) => a.year - b.year);
}

async function fetchPhotoEntries(buildingId: string | undefined, buildingName: string): Promise<PhotoEntry[]> {
  const params = new URLSearchParams({ limit: "100", buildingName });
  if (buildingId) {
    params.set("buildingId", buildingId);
  }

  const response = await fetch(`/api/content/photos?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to load photos");
  }

  const data = await response.json();
  if (!Array.isArray(data)) return [];

  return data
    .map((photo: { id: number | string; buildingName: string; year?: number; caption?: string; imageUrl: string }) => ({
      id: String(photo.id),
      buildingName: photo.buildingName,
      year: Number(photo.year) || new Date().getFullYear(),
      caption: photo.caption || "Uploaded photo",
      imageUrl: resolveDisplayImagePath(photo.imageUrl) ?? "",
    }))
    .filter((photo) => photo.imageUrl);
}

const TimelineScreen = ({ buildingId, onNavigate, renderStartMs = null }: TimelineScreenProps) => {
  const { readOnly } = useAuth();
  const building = resolveBuildingFromInput(buildingId);
  const resolvedBuildingId = building?.id ?? buildingId;
  const timelineBuildingKey = building?.id ?? buildingId;
  const apiBuildingName = building?.name ?? (buildingId ? buildingId.replace(/-/g, " ") : "");
  const localContent = buildingContent[resolvedBuildingId] || [];
  const fallbackTimelineEntries = useMemo(
    () => buildFallbackTimelineEntries(building, localContent),
    [building, localContent]
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dbPhotos, setDbPhotos] = useState<PhotoEntry[]>([]);
  const [photoLoadError, setPhotoLoadError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<{ id?: string; imageUrl: string; caption: string; buildingName: string; year: number } | null>(null);
  const [showAddPhoto, setShowAddPhoto] = useState(false);
  const [photoForm, setPhotoForm] = useState({ caption: "", year: "" });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoSubmitting, setPhotoSubmitting] = useState(false);
  const [photoSubmitError, setPhotoSubmitError] = useState<string | null>(null);
  const [photoSubmitSuccess, setPhotoSubmitSuccess] = useState(false);
  const [photoManageMode, setPhotoManageMode] = useState(false);
  const [photoEdit, setPhotoEdit] = useState<{ id: string; caption: string; year: string } | null>(null);
  const [photoEditError, setPhotoEditError] = useState<string | null>(null);
  const [photoEditSubmitting, setPhotoEditSubmitting] = useState(false);
  const [photoFilter, setPhotoFilter] = useState<"all" | "recent" | "classic">("all");

  const [timelineFilter, setTimelineFilter] = useState<"all" | "recent" | "classic">("all");
  const [timelineForm, setTimelineForm] = useState({ year: "", description: "", imagePath: "" });
  const [timelineSubmitting, setTimelineSubmitting] = useState(false);
  const [timelineFormError, setTimelineFormError] = useState<string | null>(null);
  const [timelineLoadError, setTimelineLoadError] = useState<string | null>(null);
  const [timelineSourceNotice, setTimelineSourceNotice] = useState<string | null>(null);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimelineEntry | null>(null);
  const [currentVisualIndex, setCurrentVisualIndex] = useState(0);
  const timelineMetricReported = useRef(false);
  const sampleContent = useMemo(
    () =>
      Object.entries(buildingContent)
        .flatMap(([key, rows]) =>
          rows.slice(0, 1).map((row) => ({
            buildingName: buildings.find((candidate) => candidate.id === key)?.name ?? key,
            year: row.year,
            description: row.description,
          }))
        )
        .slice(0, 3),
    []
  );
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>(fallbackTimelineEntries);
  const photoEntries = dbPhotos;

  useEffect(() => {
    timelineMetricReported.current = false;
  }, [buildingId]);

  useEffect(() => {
    setCurrentIndex(0);
  }, [timelineBuildingKey]);

  useEffect(() => {
    if (!apiBuildingName) {
      setTimelineEntries(fallbackTimelineEntries);
      setTimelineLoadError(null);
      setTimelineSourceNotice(null);
      setTimelineLoading(false);
      return;
    }

    let cancelled = false;
    setTimelineLoading(true);

    const loadTimeline = async () => {
      try {
        const nextEntries = await fetchTimelineEntries(building?.id, apiBuildingName);
        if (cancelled) return;
        if (nextEntries.length > 0) {
          setTimelineEntries(nextEntries);
          setTimelineLoadError(null);
          setTimelineSourceNotice(null);
        } else if (fallbackTimelineEntries.length > 0) {
          setTimelineEntries(fallbackTimelineEntries);
          setTimelineLoadError(null);
          setTimelineSourceNotice("No live archive rows yet. Showing bundled building history for this location.");
        } else {
          setTimelineEntries([]);
          setTimelineLoadError("No history is available for this building yet.");
          setTimelineSourceNotice(null);
        }
      } catch (error) {
        if (cancelled) return;
        if (fallbackTimelineEntries.length > 0) {
          setTimelineEntries(fallbackTimelineEntries);
          setTimelineLoadError(null);
          setTimelineSourceNotice("Live timeline unavailable. Showing bundled archive notes for this building.");
        } else {
          setTimelineEntries([]);
          setTimelineLoadError(error instanceof Error ? error.message : "Unable to load timeline.");
          setTimelineSourceNotice(null);
        }
      } finally {
        if (!cancelled) setTimelineLoading(false);
      }
    };

    void loadTimeline();

    return () => {
      cancelled = true;
    };
  }, [apiBuildingName, fallbackTimelineEntries]);

  useEffect(() => {
    if (!apiBuildingName) return;
    let cancelled = false;

    const loadPhotos = async () => {
      try {
        const data = await fetchPhotoEntries(building?.id, apiBuildingName);
        if (cancelled) return;
        setDbPhotos(data);
        setPhotoLoadError(null);
      } catch (error) {
        if (cancelled) return;
        setPhotoLoadError(error instanceof Error ? error.message : "Unable to load photos.");
        setDbPhotos([]);
      }
    };

    void loadPhotos();

    return () => {
      cancelled = true;
    };
  }, [apiBuildingName]);

  const filteredTimeline = useMemo(() => {
    const content = timelineEntries;
    if (timelineFilter === "all") return content;
    if (timelineFilter === "recent") return content.filter((item) => item.year >= 2000);
    return content.filter((item) => item.year < 2000);
  }, [timelineEntries, timelineFilter]);

  const effectiveContent = filteredTimeline;
  const filteredPhotos = useMemo(() => {
    if (photoFilter === "all") return photoEntries;
    if (photoFilter === "recent") return photoEntries.filter((photo) => (photo.year || 0) >= 2000);
    return photoEntries.filter((photo) => (photo.year || 0) < 2000);
  }, [photoEntries, photoFilter]);
  const currentEntry = effectiveContent[currentIndex];
  const currentVisualCandidates = useMemo(
    () => buildTimelineVisualCandidates(building?.id, currentEntry, photoEntries),
    [building?.id, currentEntry, photoEntries]
  );
  const fallbackVisual = useMemo(() => buildTimelineFallbackVisual(building, currentEntry), [building, currentEntry]);
  const currentVisual = currentVisualCandidates[currentVisualIndex] ?? fallbackVisual;
  const currentVisualTitle = currentVisual?.fallback
    ? "Campus image"
    : currentVisual?.exactYear
      ? "Archive image from this year"
      : `Archive image near ${currentEntry?.year}`;
  const currentVisualBadge = currentVisual?.fallback
    ? `Timeline year ${currentVisual.year}`
    : `Photo year ${currentVisual?.year}`;
  const hasPast = currentIndex > 0;
  const hasFuture = currentIndex < effectiveContent.length - 1;

  const yearProgress = useMemo(() => {
    if (effectiveContent.length <= 1) return 100;
    return ((currentIndex) / (effectiveContent.length - 1)) * 100;
  }, [currentIndex, effectiveContent.length]);

  useEffect(() => {
    if (currentIndex >= effectiveContent.length) {
      setCurrentIndex(0);
    }
  }, [effectiveContent.length, currentIndex]);

  useEffect(() => {
    setCurrentVisualIndex(0);
  }, [currentIndex, building?.id, currentEntry?.year]);

  useEffect(() => {
    if (timelineMetricReported.current || renderStartMs === null || timelineLoading) return;
    if (!building) return;

    const frame = window.requestAnimationFrame(() => {
      recordElapsedMetric("timeline-screen-render", renderStartMs, building.id);
      timelineMetricReported.current = true;
    });

    return () => window.cancelAnimationFrame(frame);
  }, [building, renderStartMs, timelineLoading]);

  const handlePhotoSubmit = async () => {
    if (!apiBuildingName) return;
    if (!photoFile) {
      setPhotoSubmitError("Photo file is required.");
      return;
    }

    setPhotoSubmitting(true);
    setPhotoSubmitError(null);
    setPhotoSubmitSuccess(false);

    try {
      const formData = new FormData();
      formData.append("photo", photoFile);
      formData.append("buildingName", building?.name ?? apiBuildingName);
      formData.append("year", photoForm.year || String(new Date().getFullYear()));
      formData.append("caption", photoForm.caption || "Uploaded archive photo");

      const response = await fetch("/api/content/photos/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Unable to upload photo");
      }

      const refreshed = await fetch(`/api/content/photos?limit=100&buildingName=${encodeURIComponent(apiBuildingName)}`);
      if (refreshed.ok) {
        setDbPhotos(await fetchPhotoEntries(building?.id, apiBuildingName));
      }
      setPhotoForm({ caption: "", year: "" });
      setPhotoFile(null);
      setPhotoSubmitSuccess(true);
      setShowAddPhoto(false);
      setTimeout(() => setPhotoSubmitSuccess(false), 2000);
    } catch {
      setPhotoSubmitError("Unable to add photo right now.");
    } finally {
      setPhotoSubmitting(false);
    }
  };

  const handlePhotoUpdate = async () => {
    if (!photoEdit) return;
    setPhotoEditSubmitting(true);
    setPhotoEditError(null);

    try {
      const response = await fetch(`/api/content/photos/${photoEdit.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: Number(photoEdit.year) || undefined,
          caption: photoEdit.caption,
        }),
      });
      if (!response.ok) {
        throw new Error("Unable to update photo");
      }
      setDbPhotos((prev) =>
        prev.map((photo) =>
          photo.id === photoEdit.id
            ? {
                ...photo,
                year: Number(photoEdit.year) || photo.year,
                caption: photoEdit.caption,
              }
            : photo
        )
      );
      if (selectedPhoto?.id === photoEdit.id) {
        setSelectedPhoto((prev) =>
          prev
            ? {
                ...prev,
                year: Number(photoEdit.year) || prev.year,
                caption: photoEdit.caption,
              }
            : prev
        );
      }
      setPhotoEdit(null);
    } catch {
      setPhotoEditError("Unable to update photo right now.");
    } finally {
      setPhotoEditSubmitting(false);
    }
  };

  const handlePhotoDelete = async (id?: string) => {
    if (!id) return;
    try {
      if (selectedPhoto?.id === id) setSelectedPhoto(null);
      const response = await fetch(`/api/content/photos/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Unable to delete photo");
      }
      setDbPhotos((prev) => prev.filter((photo) => photo.id !== id));
    } catch {
      setPhotoEditError("Unable to delete photo right now.");
    }
  };

  const handleTimelineSubmit = async () => {
    if (!apiBuildingName) return;
    if (!timelineForm.year || !timelineForm.description) {
      setTimelineFormError("Year and description are required.");
      return;
    }

    setTimelineSubmitting(true);
    setTimelineFormError(null);

    try {
      const payload = {
        buildingName: apiBuildingName,
        year: timelineForm.year,
        description: timelineForm.description,
        imagePath: timelineForm.imagePath || undefined,
      };

      const res = await fetch("/api/content/timeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to create entry");
      setTimelineEntries((prev) =>
        [...prev, {
          year: Number(timelineForm.year),
          description: timelineForm.description,
          imagePath: timelineForm.imagePath || undefined,
        }].sort((a, b) => a.year - b.year)
      );
      setTimelineForm({ year: "", description: "", imagePath: "" });
    } catch {
      setTimelineFormError("Unable to save timeline entry.");
    } finally {
      setTimelineSubmitting(false);
    }
  };

  const handleTimelineUpdate = async () => {
    if (!apiBuildingName || !editingEntry) return;
    if (!timelineForm.description && !timelineForm.imagePath && timelineForm.year === String(editingEntry.year)) {
      setTimelineFormError("Update at least one field.");
      return;
    }

    setTimelineSubmitting(true);
    setTimelineFormError(null);

    try {
      const payload = {
        buildingName: apiBuildingName,
        year: String(editingEntry.year),
        newYear: timelineForm.year !== String(editingEntry.year) ? timelineForm.year : undefined,
        description: timelineForm.description,
        imagePath: timelineForm.imagePath || undefined,
      };

      const res = await fetch("/api/content/timeline", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to update entry");
      setTimelineEntries((prev) =>
        prev
          .map((entry) =>
            entry.year === editingEntry.year && entry.description === editingEntry.description
              ? {
                  year: Number(payload.newYear) || editingEntry.year,
                  description: payload.description || editingEntry.description,
                  imagePath: payload.imagePath ?? editingEntry.imagePath,
                }
              : entry
          )
          .sort((a, b) => a.year - b.year)
      );
      setEditingEntry(null);
      setTimelineForm({ year: "", description: "", imagePath: "" });
    } catch {
      setTimelineFormError("Unable to update timeline entry.");
    } finally {
      setTimelineSubmitting(false);
    }
  };

  const handleTimelineDelete = async (year: number) => {
    if (!apiBuildingName) return;
    try {
      const res = await fetch("/api/content/timeline", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buildingName: apiBuildingName, year }),
      });
      if (!res.ok) throw new Error("Failed to delete entry");
      setTimelineEntries((prev) => prev.filter((entry) => entry.year !== year));
    } catch {
      setTimelineFormError("Unable to delete timeline entry.");
    }
  };

  const fallbackToPlaceholder = (event: SyntheticEvent<HTMLImageElement>) => {
    if (event.currentTarget.src.endsWith(FALLBACK_IMAGE_URL)) return;
    event.currentTarget.src = FALLBACK_IMAGE_URL;
  };

  if (building && timelineLoading && timelineEntries.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
        <MapPin className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-2">Loading Timeline</h2>
        <p className="text-muted-foreground text-center">
          Pulling the latest archive entries for this building.
        </p>
      </div>
    );
  }

  if (!building) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
        <MapPin className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-2">Building Not Found</h2>
        <p className="text-muted-foreground mb-6 text-center">
          We could not match that building to the campus archive.
        </p>

        {sampleContent.length > 0 && (
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

        {photoLoadError && (
          <p className="mb-4 text-center text-xs text-muted-foreground">{photoLoadError}</p>
        )}
        {timelineLoadError && (
          <p className="mb-4 text-center text-xs text-muted-foreground">{timelineLoadError}</p>
        )}

        {filteredPhotos.length > 0 && (
          <div className="w-full max-w-xl mb-6">
            <h3 className="text-sm font-semibold text-foreground mb-3 text-center">Sample Photos</h3>
            <div className="grid grid-cols-2 gap-3">
              {filteredPhotos.map((photo, index) => (
                <button
                  key={`${photo.buildingName}-${photo.year}-${index}`}
                  onClick={() => setSelectedPhoto({ ...photo })}
                  className="rounded-lg overflow-hidden border border-border bg-card text-left"
                >
                  <img src={photo.imageUrl} alt={photo.caption || "Building photo"} onError={fallbackToPlaceholder} className="w-full h-32 object-cover" />
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

        <button
          onClick={() => onNavigate("map")}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Map
        </button>
      </div>
    );
  }

  if (effectiveContent.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
        <MapPin className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-2">No Timeline Entries In This Filter</h2>
        <p className="text-muted-foreground mb-6 text-center">
          {building.name} has history entries, but none match the current filter.
        </p>
        <button
          onClick={() => setTimelineFilter("all")}
          className="mb-3 rounded-xl bg-primary px-6 py-3 font-medium text-primary-foreground"
        >
          Show All Years
        </button>
        <button
          onClick={() => onNavigate("map")}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-secondary text-secondary-foreground font-medium"
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

      <div className="px-5 pt-3">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-3 py-2">
          <span className="text-xs font-semibold text-muted-foreground">Timeline Filter</span>
          <select
            value={timelineFilter}
            onChange={(e) => setTimelineFilter(e.target.value as "all" | "recent" | "classic")}
            className="rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground"
          >
            <option value="all">All years</option>
            <option value="recent">Recent (2000+)</option>
            <option value="classic">Classic (before 2000)</option>
          </select>
        </div>
        {(timelineSourceNotice || timelineLoadError) && (
          <div className="mt-3 rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
            {timelineSourceNotice || timelineLoadError}
          </div>
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
            <div className="mb-5 overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
              {currentVisual && (
                <>
                  <img
                    key={`${currentVisual.imageUrl}-${currentVisualIndex}`}
                    src={currentVisual.imageUrl}
                    alt={currentVisual.caption}
                    onError={(event) => {
                      if (
                        currentVisualIndex >= currentVisualCandidates.length &&
                        !event.currentTarget.src.endsWith(FALLBACK_IMAGE_URL)
                      ) {
                        event.currentTarget.src = FALLBACK_IMAGE_URL;
                        return;
                      }
                      setCurrentVisualIndex((index) =>
                        index < currentVisualCandidates.length - 1 ? index + 1 : currentVisualCandidates.length
                      );
                    }}
                    className="h-64 w-full object-cover sm:h-80"
                  />
                  <div className="border-t border-border bg-background/95 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-foreground">
                        {currentVisualTitle}
                      </p>
                      <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-semibold text-foreground">
                        {currentVisualBadge}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{currentVisual.caption}</p>
                  </div>
                </>
              )}
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

      {/* Manage Timeline */}
      <div className="px-5 pb-6">
        <div className="glass-card rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-bold text-foreground text-center">
            {readOnly ? "Timeline Details" : "Manage Timeline"}
          </h3>
          {readOnly && (
            <p className="text-xs text-center text-muted-foreground">
              Guest access is read-only. Sign in with your school email to add or edit content.
            </p>
          )}

          {!readOnly && (
          <div className="space-y-2">
            <input
              type="number"
              placeholder="Year"
              value={timelineForm.year}
              onChange={(e) => setTimelineForm((prev) => ({ ...prev, year: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground"
            />
            <textarea
              placeholder="Description"
              value={timelineForm.description}
              onChange={(e) => setTimelineForm((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground min-h-[90px]"
            />
            <input
              type="text"
              placeholder="Image path (optional)"
              value={timelineForm.imagePath}
              onChange={(e) => setTimelineForm((prev) => ({ ...prev, imagePath: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground"
            />
            {timelineFormError && (
              <p className="text-xs text-muted-foreground">{timelineFormError}</p>
            )}
            <div className="flex gap-2">
              {editingEntry ? (
                <>
                  <button
                    onClick={() => {
                      setEditingEntry(null);
                      setTimelineForm({ year: "", description: "", imagePath: "" });
                      setTimelineFormError(null);
                    }}
                    className="flex-1 py-2 rounded-lg bg-muted text-muted-foreground text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleTimelineUpdate}
                    disabled={timelineSubmitting}
                    className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50"
                  >
                    {timelineSubmitting ? "Updating..." : "Update"}
                  </button>
                </>
              ) : (
                <button
                  onClick={handleTimelineSubmit}
                  disabled={timelineSubmitting}
                  className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50"
                >
                  {timelineSubmitting ? "Saving..." : "Add Entry"}
                </button>
              )}
            </div>
          </div>
          )}

          <div className="border-t border-border pt-3">
            {timelineEntries.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center">No timeline entries yet.</p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {timelineEntries.map((entry) => (
                  <div key={`${entry.year}-${entry.description.slice(0, 12)}`} className="rounded-lg border border-border p-2 bg-card">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs text-muted-foreground">{entry.year}</div>
                      {!readOnly && <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingEntry(entry);
                            setTimelineForm({
                              year: String(entry.year),
                              description: entry.description,
                              imagePath: entry.imagePath || "",
                            });
                            setTimelineFormError(null);
                          }}
                          className="text-xs font-semibold text-primary"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleTimelineDelete(entry.year)}
                          className="text-xs font-semibold text-rose-500"
                        >
                          Delete
                        </button>
                      </div>}
                    </div>
                    <p className="text-xs text-foreground/80 mt-1 line-clamp-2">{entry.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Photo section */}
      <div className="px-5 pb-6">
        <div className="glass-card rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-bold text-foreground text-center">Photos from the Archive</h3>
          {!readOnly && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">Manage photos</span>
              <button
                onClick={() => setPhotoManageMode((prev) => !prev)}
                className="text-xs font-semibold text-primary"
              >
                {photoManageMode ? "Done" : "Edit"}
              </button>
            </div>
          )}
          {readOnly && (
            <p className="text-xs text-center text-muted-foreground">
              Guests can browse archive photos, but uploading and editing require sign-in.
            </p>
          )}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">Photo filter</span>
            <select
              value={photoFilter}
              onChange={(e) => setPhotoFilter(e.target.value as "all" | "recent" | "classic")}
              className="rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground"
            >
              <option value="all">All years</option>
              <option value="recent">Recent (2000+)</option>
              <option value="classic">Classic (before 2000)</option>
            </select>
          </div>

          {filteredPhotos.length === 0 && (
            <p className="text-xs text-muted-foreground text-center">
              No archived photos found for this building.
            </p>
          )}

          {filteredPhotos.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {filteredPhotos.map((photo, index) => (
                <div key={`${photo.buildingName}-${photo.year}-${index}`} className="rounded-lg overflow-hidden border border-border bg-card">
                  <button
                    onClick={() => setSelectedPhoto({ ...photo })}
                    className="w-full"
                  >
                    <img src={photo.imageUrl} alt={photo.caption || "Building photo"} onError={fallbackToPlaceholder} className="w-full h-24 object-cover" />
                  </button>
                  {photoManageMode && (
                    <div className="flex items-center justify-between px-2 py-1 text-xs">
                      <button
                        disabled={!photo.id}
                        onClick={() => setPhotoEdit({ id: photo.id || "", caption: photo.caption || "", year: String(photo.year || "") })}
                        className="text-primary font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Edit
                      </button>
                      <button
                        disabled={!photo.id}
                        onClick={() => handlePhotoDelete(photo.id)}
                        className="text-rose-500 font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="pt-2">
            {readOnly ? null : !showAddPhoto ? (
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

          {!readOnly && photoEdit && (
            <div className="border-t border-border pt-3 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">Edit selected photo</p>
              <input
                type="number"
                placeholder="Year"
                value={photoEdit.year}
                onChange={(e) => setPhotoEdit((prev) => prev ? { ...prev, year: e.target.value } : prev)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground"
              />
              <input
                type="text"
                placeholder="Caption"
                value={photoEdit.caption}
                onChange={(e) => setPhotoEdit((prev) => prev ? { ...prev, caption: e.target.value } : prev)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground"
              />
              {photoEditError && (
                <p className="text-xs text-muted-foreground">{photoEditError}</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => setPhotoEdit(null)}
                  className="flex-1 py-2 rounded-lg bg-muted text-muted-foreground text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePhotoUpdate}
                  disabled={photoEditSubmitting}
                  className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50"
                >
                  {photoEditSubmitting ? "Updating..." : "Update"}
                </button>
              </div>
            </div>
          )}
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
              onError={fallbackToPlaceholder}
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
