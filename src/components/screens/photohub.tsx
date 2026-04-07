import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Heart, MessageCircle, Upload, ChevronLeft, ChevronRight, X, Send, SortAsc, ImagePlus, Trash2 } from "lucide-react";
import { buildings } from "@/data/geoTable";
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

const PhotoHubScreen = ({ onNavigate }: PhotoHubScreenProps) => {
  const { readOnly } = useAuth();
  const [photos, setPhotos] = useState<HubPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
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

  const normalizeBuildingId = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const resolveBuildingId = (buildingName: string) => {
    const normalized = normalizeBuildingId(buildingName);
    return buildings.find((b) => normalizeBuildingId(b.id) === normalized || normalizeBuildingId(b.name) === normalized)?.id ?? normalized;
  };

  const loadPhotos = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetch("/api/content/photos?limit=100");
      if (!response.ok) {
        throw new Error("Failed to load photos");
      }
      const data = await response.json();
      const nextPhotos: HubPhoto[] = Array.isArray(data)
        ? data.map((photo: { id: number | string; buildingName: string; year?: number; imageUrl: string; caption?: string }) => ({
            id: String(photo.id),
            buildingId: resolveBuildingId(photo.buildingName),
            buildingName: photo.buildingName,
            year: Number(photo.year) || new Date().getFullYear(),
            imageUrl: photo.imageUrl,
            caption: photo.caption || "Uploaded photo",
            uploadedAt: new Date().toISOString(),
            likes: 0,
            liked: false,
            comments: [],
          }))
        : [];
      setPhotos(nextPhotos);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Unable to load photos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPhotos();
  }, []);

  // Buildings that have photos
  const buildingsWithPhotos = useMemo(() => {
    const ids = new Set(photos.map((p) => p.buildingId));
    return buildings.filter((b) => ids.has(b.id));
  }, [photos]);

  // Filter & sort
  const filteredPhotos = useMemo(() => {
    let result = selectedBuildingFilter === "all"
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
    if (file.size > 100 * 1024 * 1024) {
      alert("File too large. Maximum size is 100MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPreviewImage(reader.result as string);
    reader.readAsDataURL(file);
    setUploadFile(file);
  };

  const handleUpload = async () => {
    if (!uploadFile) return;
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
        throw new Error("Upload failed");
      }
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

  const handleComment = (photoId: string) => {
    if (!commentText.trim()) return;
    setPhotos((current) =>
      current.map((photo) =>
        photo.id === photoId
          ? {
              ...photo,
              comments: [...photo.comments, { id: crypto.randomUUID(), author: "Guest", text: commentText.trim() }],
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
          <button
            onClick={() => !readOnly && setShowUpload(true)}
            aria-label="Open upload panel"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-foreground/20 text-sm font-medium hover:bg-primary-foreground/30 transition-colors"
            disabled={readOnly}
          >
            <Upload className="w-4 h-4" /> Upload
          </button>
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
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading photos...</p>
          </div>
        ) : filteredPhotos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No photos yet for this building.</p>
            {loadError && <p className="mt-2 text-xs text-muted-foreground">{loadError}</p>}
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
                  <img src={photo.imageUrl} alt={photo.caption} className="w-full h-full object-cover" />
                  {!readOnly && <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <label className="p-2 rounded-full bg-card/80 cursor-pointer hover:bg-card transition-colors">
                      <ImagePlus className="w-4 h-4 text-foreground" />
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleChangePhoto(photo.id, e)} />
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
                  accept="image/*"
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
                disabled={!previewImage}
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
