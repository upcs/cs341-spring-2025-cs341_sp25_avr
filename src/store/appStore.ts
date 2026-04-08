import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { archivePhotos } from "@/data/geoTable";

export interface Photo {
  id: string;
  buildingId: string;
  buildingName: string;
  year: number;
  imageUrl: string;
  caption: string;
  uploadedAt: string;
  likes: number;
  liked: boolean;
  comments: Comment[];
}

export interface Comment {
  id: string;
  text: string;
  author: string;
  createdAt: string;
}

interface AppState {
  // Stamps
  stamps: Set<string>;
  addStamp: (id: string) => void;
  resetStamps: () => void;

  // Photos
  photos: Photo[];
  addPhoto: (photo: Omit<Photo, "id" | "likes" | "liked" | "comments" | "uploadedAt">) => void;
  updatePhotoImage: (photoId: string, imageUrl: string) => void;
  updatePhotoDetails: (photoId: string, updates: { caption?: string; year?: number }) => void;
  deletePhoto: (photoId: string) => void;
  toggleLike: (photoId: string) => void;
  addComment: (photoId: string, text: string) => void;
}

const samplePhotos: Photo[] = archivePhotos.map((photo) => ({
  id: photo.id,
  buildingId: photo.buildingId,
  buildingName: photo.buildingName,
  year: photo.year,
  imageUrl: photo.imageUrl,
  caption: photo.caption,
  uploadedAt: `${photo.year}-01-01T00:00:00.000Z`,
  likes: 0,
  liked: false,
  comments: [],
}));

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      stamps: new Set<string>(),
      addStamp: (id) =>
        set((state) => {
          const next = new Set(state.stamps);
          next.add(id);
          return { stamps: next };
        }),
      resetStamps: () => set({ stamps: new Set<string>() }),

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
              uploadedAt: new Date().toISOString(),
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
      updatePhotoDetails: (photoId, updates) =>
        set((state) => ({
          photos: state.photos.map((photo) =>
            photo.id === photoId
              ? {
                  ...photo,
                  caption: updates.caption ?? photo.caption,
                  year: updates.year ?? photo.year,
                }
              : photo
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
                    { id: `c${Date.now()}`, text, author: "You", createdAt: new Date().toISOString() },
                  ],
                }
              : p
          ),
        })),
    }),
    {
      name: "avr-app-store",
      storage: createJSONStorage(() => window.localStorage),
      partialize: (state) => ({
        photos: state.photos,
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as { photos?: Photo[] } | undefined;
        return {
          ...currentState,
          ...persisted,
          stamps: new Set<string>(),
          photos: persisted?.photos?.length ? persisted.photos : currentState.photos,
        };
      },
      version: 4,
      migrate: (persistedState) => {
        const persisted = (persistedState ?? {}) as { photos?: Photo[] };
        return {
          ...persisted,
          stamps: [],
        };
      },
    }
  )
);
