import { useEffect, useMemo, useState, type SyntheticEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Heart, MessageCircle, Upload, ChevronLeft, ChevronRight, X, Send, SortAsc, ImagePlus, Trash2 } from "lucide-react";
import { buildings } from "@/data/buildings";
import { archivePhotos, resolveDisplayImagePath } from "@/data/geoTable";
import { useAuth } from "@/components/auth-context";
import type { Screen } from "@/pages/Index";

interface PhotoHubScreenProps {
  onNavigate: (screen: Screen) => void;
}

type SortOption = "newest" | "oldest" | "most-liked";

type HubPhoto = {
  id: string;
  buildingId: string;
  buildingName: string;
  year: number;
  imageUrl: string;
  caption: string;
  uploadedAt: string;
  likes: number;
  liked: boolean;
  comments: Array<{ id: string; author: string; text: string }>;
};

type PendingSubmission = {
  id: string;
  buildingName: string;
  year: number | null;
  imageUrl: string;
  caption: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  submittedByName?: string | null;
};

const FALLBACK_IMAGE_URL = "/placeholder.svg";
const MAX_PHOTO_UPLOAD_BYTES = 5 * 1024 * 1024;
const PHOTO_FILE_ACCEPT = "image/*,.heic,.heif,.tif,.tiff,.bmp,.avif,.webp";
const PHOTO_EXTENSION_PATTERN = /\.(jpe?g|png|gif|webp|avif|bmp|tiff?|heic|heif)$/i;

const isPhotoFile = (file: File) =>
  (file.type.startsWith("image/") && file.type !== "image/svg+xml") || PHOTO_EXTENSION_PATTERN.test(file.name);

const getDisplayImageUrl = (imageUrl: string | null | undefined) => {
  if (!imageUrl) return FALLBACK_IMAGE_URL;
  if (imageUrl === FALLBACK_IMAGE_URL || /^(data:image\/|blob:|https?:\/\/)/i.test(imageUrl)) {
    return imageUrl;
  }
  return PHOTO_EXTENSION_PATTERN.test(imageUrl) ? (resolveDisplayImagePath(imageUrl) ?? imageUrl) : FALLBACK_IMAGE_URL;
};

const PhotoHubScreen = ({ onNavigate }: PhotoHubScreenProps) => {
  const { readOnly, displayName, isAdmin = false } = useAuth();
  const [photos, setPhotos] = useState<HubPhoto[]>([]);
  const [pendingSubmissions, setPendingSubmissions] = useState<PendingSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [activeSubmissionId, setActiveSubmissionId] = useState<string | null>(null);
  const [selectedBuildingFilter, setSelectedBuildingFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showSort, setShowSort] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [commentingOn, setCommentingOn] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [uploadCaption, setUploadCaption] = useState("");
  const [uploadBuilding, setUploadBuilding] = useState(buildings[0].id);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<HubPhoto | null>(null);

  const normalizeBuildingId = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const resolveBuildingId = (buildingName: string) => {
    const normalized = normalizeBuildingId(buildingName);
    return buildings.find((b) => normalizeBuildingId(b.id) === normalized || normalizeBuildingId(b.name) === normalized)?.id ?? normalized;
  };
  const fallbackToPlaceholder = (event: SyntheticEvent<HTMLImageElement>) => {
    if (event.currentTarget.src.endsWith(FALLBACK_IMAGE_URL)) return;
    event.currentTarget.src = FALLBACK_IMAGE_URL;
  };
  const buildBundledHubPhotos = (): HubPhoto[] =>
    archivePhotos.map((photo) => {
      const buildingName = buildings.find((building) => building.id === photo.buildingId)?.name ?? photo.buildingName;
      return {
        id: `bundled-${photo.id}`,
        buildingId: photo.buildingId,
        buildingName,
        year: photo.year,
        imageUrl: resolveDisplayImagePath(photo.imageUrl) ?? photo.imageUrl,
        caption: photo.caption || "Archive photo",
        uploadedAt: `${photo.year}-01-01T00:00:00.000Z`,
        likes: 0,
        liked: false,
        comments: [],
      };
    });
  const mergePhotoLists = (livePhotos: HubPhoto[], bundledPhotos: HubPhoto[]) => {
    const merged = new Map<string, HubPhoto>();
    const addPhoto = (photo: HubPhoto) => {
      const key = `${photo.buildingId}:${photo.year}:${normalizeBuildingId(photo.caption)}`;
      if (!merged.has(key)) {
        merged.set(key, photo);
      }
    };
    livePhotos.forEach(addPhoto);
    bundledPhotos.forEach(addPhoto);
    return Array.from(merged.values());
  };

  const loadPhotos = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [photosResponse, submissionsResponse] = await Promise.all([
        fetch("/api/content/photos?limit=100"),
        isAdmin ? fetch("/api/content/photos/submissions?status=pending") : Promise.resolve(null),
      ]);

      if (!photosResponse.ok) {
        throw new Error("Failed to load photos");
      }
      const data = await photosResponse.json();
      const nextPhotos: HubPhoto[] = Array.isArray(data)
        ? data.map((photo: { id: number | string; buildingName: string; year?: number; imageUrl: string; caption?: string }) => ({
            id: String(photo.id),
            buildingId: resolveBuildingId(photo.buildingName),
            buildingName: photo.buildingName,
            year: Number(photo.year) || new Date().getFullYear(),
            imageUrl: getDisplayImageUrl(photo.imageUrl),
            caption: photo.caption || "Uploaded photo",
            uploadedAt: new Date().toISOString(),
            likes: 0,
            liked: false,
            comments: [],
          }))
        : [];
      setPhotos(mergePhotoLists(nextPhotos, buildBundledHubPhotos()));

      if (submissionsResponse) {
        if (!submissionsResponse.ok) {
          throw new Error("Failed to load photo submissions");
        }

        const submissionsData = await submissionsResponse.json();
        setPendingSubmissions(
          Array.isArray(submissionsData)
            ? submissionsData.map((submission) => ({
                id: String(submission.id),
                buildingName: submission.buildingName,
                year: submission.year === null || submission.year === undefined ? null : Number(submission.year),
                imageUrl: getDisplayImageUrl(submission.imageUrl),
                caption: submission.caption || "Uploaded photo",
                status: submission.status || "pending",
                submittedAt: submission.submittedAt || new Date().toISOString(),
                submittedByName: submission.submittedByName || null,
              }))
            : []
        );
      } else {
        setPendingSubmissions([]);
      }
    } catch (error) {
      setPhotos(buildBundledHubPhotos());
      setLoadError(
        error instanceof Error
          ? `${error.message}. Showing bundled archive photos.`
          : "Unable to load live photos. Showing bundled archive photos."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPhotos();
  }, [isAdmin]);

  // Buildings that have photos
  const buildingsWithPhotos = useMemo(() => {
    const ids = new Set(photos.map((p) => p.buildingId));
    return buildings.filter((b) => ids.has(b.id));
  }, [photos]);

  // Filter & sort
  const filteredPhotos = useMemo(() => {
    const result = selectedBuildingFilter === "all"
      ? [...photos]
      : photos.filter((p) => p.buildingId === selectedBuildingFilter);

    switch (sortBy) {
      case "newest":
        result.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
        break;
      case "oldest":
        result.sort((a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime());
        break;
      case "most-liked":
        result.sort((a, b) => b.likes - a.likes);
        break;
    }
    return result;
  }, [photos, selectedBuildingFilter, sortBy]);

  // Building name for filter nav
  const currentFilterIndex = selectedBuildingFilter === "all"
    ? -1
    : buildingsWithPhotos.findIndex((b) => b.id === selectedBuildingFilter);

  const navigateFilter = (dir: "prev" | "next") => {
    if (selectedBuildingFilter === "all") {
      if (dir === "next" && buildingsWithPhotos.length > 0) setSelectedBuildingFilter(buildingsWithPhotos[0].id);
      return;
    }
    const idx = currentFilterIndex;
    if (dir === "prev") {
      if (idx <= 0) setSelectedBuildingFilter("all");
      else setSelectedBuildingFilter(buildingsWithPhotos[idx - 1].id);
    } else {
      if (idx >= buildingsWithPhotos.length - 1) setSelectedBuildingFilter("all");
      else setSelectedBuildingFilter(buildingsWithPhotos[idx + 1].id);
    }
  };

  const currentFilterName = selectedBuildingFilter === "all"
    ? "All Buildings"
    : buildings.find((b) => b.id === selectedBuildingFilter)?.name || "Unknown";

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isPhotoFile(file)) {
      alert("Choose an image file.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_PHOTO_UPLOAD_BYTES) {
      alert("File too large. Maximum size is 5MB.");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPreviewImage(reader.result as string);
    reader.readAsDataURL(file);
    setUploadFile(file);
  };

  const handleUpload = async () => {
    if (!uploadFile) return;
    setStatusMessage(null);
    const formData = new FormData();
    const building = buildings.find((b) => b.id === uploadBuilding);
    formData.append("photo", uploadFile);
    formData.append("buildingName", building?.name ?? uploadBuilding);
    formData.append("caption", uploadCaption || "Uploaded photo");
    try {
      const response = await fetch("/api/content/photos/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message || "Upload failed");
      }
      const payload = await response.json().catch(() => null);
      setStatusMessage(payload?.message || "Photo submitted for admin approval.");
      await loadPhotos();
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Unable to upload photo.");
      return;
    }
    setShowUpload(false);
    setPreviewImage(null);
    setUploadCaption("");
    setUploadFile(null);
  };

  const handleModeration = async (submissionId: string, action: "approve" | "reject") => {
    setActiveSubmissionId(submissionId);
    setLoadError(null);
    setStatusMessage(null);

    try {
      const response = await fetch(`/api/content/photos/submissions/${submissionId}/${action}`, {
        method: "POST",
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message || `Unable to ${action} submission`);
      }

      setStatusMessage(action === "approve" ? "Photo approved." : "Photo rejected.");
      await loadPhotos();
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : `Unable to ${action} submission.`);
    } finally {
      setActiveSubmissionId(null);
    }
  };

  // Handles comment/comment sorting
  const handleComment = (photoId: string) => {
    if (!commentText.trim()) return;
    setPhotos((current) =>
      current.map((photo) =>
        photo.id === photoId
          ? {
              ...photo,
              comments: [
                ...photo.comments,
                { id: crypto.randomUUID(), author: displayName || "Guest", text: commentText.trim() },
              ],
            }
          : photo
      )
    );
    setCommentText("");
    setCommentingOn(null);
  };

  const handleChangePhoto = async (photoId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isPhotoFile(file)) {
      setLoadError("Choose an image file.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_PHOTO_UPLOAD_BYTES) {
      setLoadError("File too large. Maximum size is 5MB.");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const response = await fetch(`/api/content/photos/${photoId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: reader.result }),
        });
        if (!response.ok) {
          throw new Error("Unable to update photo");
        }
        await loadPhotos();
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "Unable to update photo.");
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-purple text-primary-foreground px-5 py-5">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => onNavigate("home")}
            className="flex items-center gap-2 text-sm opacity-80 hover:opacity-100 transition-opacity"
          >
            <ArrowLeft className="w-4 h-4" /> Home
          </button>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <span className="rounded-lg bg-amber-300 px-3 py-1.5 text-xs font-bold text-amber-950">
                Admin Review: {pendingSubmissions.length}
              </span>
            )}
            <button
              onClick={() => !readOnly && setShowUpload(true)}
              aria-label="Open upload panel"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-foreground/20 text-sm font-medium hover:bg-primary-foreground/30 transition-colors"
              disabled={readOnly}
            >
              <Upload className="w-4 h-4" /> Upload
            </button>
          </div>
        </div>
        <h1 className="text-3xl font-bold">Photo Hub</h1>
      </div>

      {/* Building filter navigation */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-card">
        <button aria-label="Previous building filter" onClick={() => navigateFilter("prev")} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1 text-center">
          <span className="font-display font-semibold text-foreground">{currentFilterName}</span>
        </div>
        <button aria-label="Next building filter" onClick={() => navigateFilter("next")} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
          <ChevronRight className="w-5 h-5 text-foreground" />
        </button>
        <button
          aria-label="Sort photos"
          onClick={() => setShowSort(!showSort)}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors relative"
        >
          <SortAsc className="w-5 h-5 text-foreground" />
        </button>
      </div>

      {/* Sort dropdown */}
      <AnimatePresence>
        {showSort && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-border bg-card"
          >
            <div className="px-4 py-2 flex gap-2">
              {(["newest", "oldest", "most-liked"] as SortOption[]).map((opt) => (
                <button
                  key={opt}
                  onClick={() => { setSortBy(opt); setShowSort(false); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    sortBy === opt ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {opt === "newest" ? "Newest" : opt === "oldest" ? "Oldest" : "Most Liked"}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Photo grid */}
      <div className="p-4">
        {isAdmin && (
          <section className="mb-5 rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-800">Admin Only</p>
                <h2 className="text-lg font-bold text-amber-950">Review Uploaded Photos</h2>
                <p className="text-xs text-amber-900">Approve or deny user-submitted photos before they appear in Photo Hub.</p>
              </div>
              <span className="rounded-full bg-amber-200 px-2.5 py-1 text-xs font-bold text-amber-950">
                {pendingSubmissions.length} pending
              </span>
            </div>

            {pendingSubmissions.length === 0 ? (
              <p className="text-sm text-amber-900">No pending submissions.</p>
            ) : (
              <div className="space-y-3">
                {pendingSubmissions.map((submission) => (
                  <div key={submission.id} className="flex gap-3 rounded-xl border border-amber-200 bg-card p-3">
                    <img
                      src={submission.imageUrl}
                      alt={submission.caption}
                      onError={fallbackToPlaceholder}
                      className="h-24 w-24 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{submission.buildingName}</p>
                          <p className="text-xs text-muted-foreground">
                            {submission.year || "Year not provided"}
                            {submission.submittedByName ? ` • Submitted by ${submission.submittedByName}` : ""}
                          </p>
                        </div>
                        <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                          Pending
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-foreground">{submission.caption}</p>
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => void handleModeration(submission.id, "approve")}
                          disabled={activeSubmissionId === submission.id}
                          className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleModeration(submission.id, "reject")}
                          disabled={activeSubmissionId === submission.id}
                          className="rounded-lg bg-muted px-3 py-2 text-xs font-semibold text-foreground disabled:opacity-60"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {(loadError || statusMessage) && !loading && (
          <div className="mb-4 space-y-1">
            {loadError && <p className="text-xs text-destructive">{loadError}</p>}
            {statusMessage && <p className="text-xs text-foreground">{statusMessage}</p>}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading photos...</p>
          </div>
        ) : filteredPhotos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No photos yet for this building.</p>
            {!readOnly && (
              <button
                onClick={() => setShowUpload(true)}
                className="mt-3 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
              >
                Be the first to upload!
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredPhotos.map((photo, i) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card rounded-xl overflow-hidden border border-border shadow-sm"
              >
                <div className="aspect-square overflow-hidden relative group">
                  <button
                    type="button"
                    onClick={() => setSelectedPhoto(photo)}
                    className="block h-full w-full"
                    aria-label={`Open photo ${photo.caption}`}
                  >
                    <img src={photo.imageUrl} alt={photo.caption} onError={fallbackToPlaceholder} className="w-full h-full object-cover" />
                  </button>
                  {isAdmin && <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <label className="p-2 rounded-full bg-card/80 cursor-pointer hover:bg-card transition-colors">
                      <ImagePlus className="w-4 h-4 text-foreground" />
                      <input type="file" accept={PHOTO_FILE_ACCEPT} className="hidden" onChange={(e) => handleChangePhoto(photo.id, e)} />
                    </label>
                    <button
                      onClick={async () => {
                        try {
                          const response = await fetch(`/api/content/photos/${photo.id}`, {
                            method: "DELETE",
                          });
                          if (!response.ok) {
                            throw new Error("Unable to delete photo");
                          }
                          await loadPhotos();
                        } catch (error) {
                          setLoadError(error instanceof Error ? error.message : "Unable to delete photo.");
                        }
                      }}
                      className="p-2 rounded-full bg-card/80 hover:bg-destructive/80 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-foreground" />
                    </button>
                  </div>}
                </div>
                <div className="p-2.5">
                  <p className="text-xs text-foreground line-clamp-2 mb-2">{photo.caption}</p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() =>
                        !readOnly &&
                        setPhotos((current) =>
                          current.map((entry) =>
                            entry.id === photo.id
                              ? {
                                  ...entry,
                                  liked: !entry.liked,
                                  likes: entry.liked ? Math.max(0, entry.likes - 1) : entry.likes + 1,
                                }
                              : entry
                          )
                        )
                      }
                      className="flex items-center gap-1 text-xs"
                      disabled={readOnly}
                    >
                      <Heart
                        className={`w-4 h-4 transition-colors ${
                          photo.liked ? "fill-red-500 text-red-500" : "text-muted-foreground"
                        }`}
                      />
                      <span className="text-muted-foreground">{photo.likes}</span>
                    </button>
                    <button
                      onClick={() => !readOnly && setCommentingOn(commentingOn === photo.id ? null : photo.id)}
                      className="flex items-center gap-1 text-xs"
                      disabled={readOnly}
                    >
                      <MessageCircle className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{photo.comments.length}</span>
                    </button>
                  </div>

                  {/* Comments section */}
                  <AnimatePresence>
                    {!readOnly && commentingOn === photo.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mt-2 border-t border-border pt-2"
                      >
                        {photo.comments.map((c) => (
                          <div key={c.id} className="mb-1.5">
                            <span className="text-[10px] font-semibold text-foreground">{c.author}: </span>
                            <span className="text-[10px] text-muted-foreground">{c.text}</span>
                          </div>
                        ))}
                        <div className="flex gap-1 mt-1">
                          <input
                            type="text"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="Add comment..."
                            className="flex-1 text-[10px] px-2 py-1 rounded-md bg-muted text-foreground border-none outline-none"
                            onKeyDown={(e) => e.key === "Enter" && handleComment(photo.id)}
                          />
                          <button
                            onClick={() => handleComment(photo.id)}
                            className="p-1 rounded-md bg-primary text-primary-foreground"
                          >
                            <Send className="w-3 h-3" />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Upload modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/70 px-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-3xl overflow-hidden rounded-2xl bg-card shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{selectedPhoto.buildingName}</p>
                  <p className="text-xs text-muted-foreground">{selectedPhoto.year}</p>
                </div>
                <button onClick={() => setSelectedPhoto(null)} className="rounded-lg p-1 hover:bg-muted">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <img
                src={selectedPhoto.imageUrl}
                alt={selectedPhoto.caption}
                onError={fallbackToPlaceholder}
                className="max-h-[70vh] w-full object-contain bg-black/80"
              />
              <div className="px-4 py-3">
                <p className="text-sm text-foreground">{selectedPhoto.caption}</p>
              </div>
            </motion.div>
          </motion.div>
        )}

        {!readOnly && showUpload && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/50 flex items-end justify-center"
            onClick={() => setShowUpload(false)}
          >
            <motion.div
              initial={{ y: 300 }}
              animate={{ y: 0 }}
              exit={{ y: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-card rounded-t-2xl p-5 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold font-display text-foreground">Upload Photo</h3>
                <button onClick={() => setShowUpload(false)} className="p-1 rounded-lg hover:bg-muted">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Building selector */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Building</label>
                <select
                  value={uploadBuilding}
                  onChange={(e) => setUploadBuilding(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-muted text-foreground text-sm border-none outline-none"
                >
                  {buildings.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              {/* File input */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Photo</label>
                <input
                  type="file"
                  accept={PHOTO_FILE_ACCEPT}
                  onChange={handleFileSelect}
                  className="w-full text-sm text-foreground file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
              </div>

              {previewImage && (
                <img src={previewImage} alt="Preview" className="w-full max-h-48 object-cover rounded-lg" />
              )}

              {/* Caption */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Caption</label>
                <input
                  type="text"
                  value={uploadCaption}
                  onChange={(e) => setUploadCaption(e.target.value)}
                  placeholder="Describe your photo..."
                  className="w-full px-3 py-2 rounded-lg bg-muted text-foreground text-sm border-none outline-none"
                />
              </div>

              <button
                onClick={handleUpload}
                disabled={!uploadFile}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Upload Photo
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PhotoHubScreen;
