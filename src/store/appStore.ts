import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { buildings } from "@/data/buildings";

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
  activeUserKey: string;
  stamps: Set<string>;
  stampCollections: Record<string, string[]>;
  setActiveUser: (userKey: string) => void;
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

const samplePhotos: Photo[] = [];

const questStampIdSet = new Set(buildings.slice(0, 12).map((building) => building.id));

function sanitizeStampIds(ids: Iterable<string> | undefined) {
  if (!ids) {
    return [];
  }

  return Array.from(new Set(ids)).filter((id) => questStampIdSet.has(id));
}

function sanitizeStampCollections(collections: Record<string, string[]> | undefined) {
  if (!collections) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(collections).map(([userKey, ids]) => [userKey, sanitizeStampIds(ids)])
  );
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeUserKey: "guest:anonymous",
      stamps: new Set<string>(),
      stampCollections: {},
      setActiveUser: (userKey) =>
        set((state) => ({
          activeUserKey: userKey,
          stamps: new Set(sanitizeStampIds(state.stampCollections[userKey])),
        })),
      addStamp: (id) =>
        set((state) => {
          if (!questStampIdSet.has(id)) {
            return state;
          }

          const next = new Set(state.stamps);
          next.add(id);
          return {
            stamps: next,
            stampCollections: {
              ...state.stampCollections,
              [state.activeUserKey]: sanitizeStampIds(next),
            },
          };
        }),
      resetStamps: () =>
        set((state) => ({
          stamps: new Set<string>(),
          stampCollections: {
            ...state.stampCollections,
            [state.activeUserKey]: [],
          },
        })),

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
        stampCollections: sanitizeStampCollections(state.stampCollections),
        photos: state.photos,
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as { photos?: Photo[]; stampCollections?: Record<string, string[]> } | undefined;
        const activeUserKey = currentState.activeUserKey;
        const stampCollections = sanitizeStampCollections(persisted?.stampCollections);
        return {
          ...currentState,
          ...persisted,
          activeUserKey,
          stampCollections,
          stamps: new Set<string>(sanitizeStampIds(stampCollections[activeUserKey])),
          photos: persisted?.photos?.length ? persisted.photos : currentState.photos,
        };
      },
      version: 5,
      migrate: (persistedState) => {
        const persisted = (persistedState ?? {}) as { photos?: Photo[]; stampCollections?: Record<string, string[]> };
        return {
          ...persisted,
          stampCollections: sanitizeStampCollections(persisted.stampCollections),
          stamps: [],
        };
      },
    }
  )
);
