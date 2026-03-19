import { create } from "zustand";
import { archivePhotos } from "@/data/geoTable";

export interface Photo {
  id: string;
  buildingId: string;
  imageUrl: string;
  caption: string;
  uploadedAt: Date;
  likes: number;
  liked: boolean;
  comments: Comment[];
}

export interface Comment {
  id: string;
  text: string;
  author: string;
  createdAt: Date;
}

interface AppState {
  // Stamps
  stamps: Set<string>;
  toggleStamp: (id: string) => void;
  addStamp: (id: string) => void;

  // Photos
  photos: Photo[];
  addPhoto: (photo: Omit<Photo, "id" | "likes" | "liked" | "comments" | "uploadedAt">) => void;
  updatePhotoImage: (photoId: string, imageUrl: string) => void;
  deletePhoto: (photoId: string) => void;
  toggleLike: (photoId: string) => void;
  addComment: (photoId: string, text: string) => void;
}

const samplePhotos: Photo[] = archivePhotos.map((photo) => ({
  id: photo.id,
  buildingId: photo.buildingId,
  imageUrl: photo.imageUrl,
  caption: photo.caption,
  uploadedAt: new Date(`${photo.year}-01-01T00:00:00Z`),
  likes: 0,
  liked: false,
  comments: [],
}));

export const useAppStore = create<AppState>((set) => ({
  stamps: new Set<string>(),
  toggleStamp: (id) =>
    set((state) => {
      const next = new Set(state.stamps);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { stamps: next };
    }),
  addStamp: (id) =>
    set((state) => {
      const next = new Set(state.stamps);
      next.add(id);
      return { stamps: next };
    }),

  photos: samplePhotos,
  addPhoto: (photo) =>
    set((state) => ({
      photos: [
        {
          ...photo,
          id: `p${Date.now()}`,
          likes: 0,
          liked: false,
          comments: [],
          uploadedAt: new Date(),
        },
        ...state.photos,
      ],
    })),
  updatePhotoImage: (photoId, imageUrl) =>
    set((state) => ({
      photos: state.photos.map((p) =>
        p.id === photoId ? { ...p, imageUrl } : p
      ),
    })),
  deletePhoto: (photoId) =>
    set((state) => ({
      photos: state.photos.filter((p) => p.id !== photoId),
    })),
  toggleLike: (photoId) =>
    set((state) => ({
      photos: state.photos.map((p) =>
        p.id === photoId
          ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
          : p
      ),
    })),
  addComment: (photoId, text) =>
    set((state) => ({
      photos: state.photos.map((p) =>
        p.id === photoId
          ? {
              ...p,
              comments: [
                ...p.comments,
                { id: `c${Date.now()}`, text, author: "You", createdAt: new Date() },
              ],
            }
          : p
      ),
    })),
}));
