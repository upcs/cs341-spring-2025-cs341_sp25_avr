import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildings } from "@/data/buildings";

const questBuildingIds = buildings.slice(0, 12).map((building) => building.id);
const nonQuestBuildingId = buildings.find((building) => !questBuildingIds.includes(building.id))?.id ?? "non-quest-building";

async function loadStore() {
  vi.resetModules();
  const { useAppStore } = await import("@/store/appStore");
  return useAppStore;
}

describe("useAppStore quest stamps", () => {
  beforeEach(() => {
    window.localStorage.removeItem("avr-app-store");
    vi.useRealTimers();
  });

  it("only adds stamps for the 12 quest buildings", async () => {
    const useAppStore = await loadStore();

    useAppStore.setState({
      activeUserKey: "guest:test-user",
      stamps: new Set<string>(),
      stampCollections: {},
      photos: useAppStore.getState().photos,
    });

    useAppStore.getState().addStamp(questBuildingIds[0]);
    useAppStore.getState().addStamp(nonQuestBuildingId);

    const { stamps, stampCollections } = useAppStore.getState();

    expect(Array.from(stamps)).toEqual([questBuildingIds[0]]);
    expect(stampCollections["guest:test-user"]).toEqual([questBuildingIds[0]]);
  });

  it("filters out non-quest stamps when switching users and resets the active collection", async () => {
    const useAppStore = await loadStore();

    useAppStore.setState({
      activeUserKey: "guest:test-user",
      stamps: new Set<string>(),
      stampCollections: {
        "guest:test-user": [questBuildingIds[1], nonQuestBuildingId],
      },
      photos: useAppStore.getState().photos,
    });

    useAppStore.getState().setActiveUser("guest:test-user");
    expect(Array.from(useAppStore.getState().stamps)).toEqual([questBuildingIds[1]]);

    useAppStore.getState().resetStamps();
    expect(Array.from(useAppStore.getState().stamps)).toEqual([]);
    expect(useAppStore.getState().stampCollections["guest:test-user"]).toEqual([]);
  });

  it("manages photo uploads, edits, likes, comments, and deletion", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-16T12:00:00.000Z"));

    const useAppStore = await loadStore();
    const initialCount = useAppStore.getState().photos.length;

    useAppStore.getState().addPhoto({
      buildingId: questBuildingIds[0],
      buildingName: "Quest Building",
      year: 1995,
      imageUrl: "/photos/original.jpg",
      caption: "Original caption",
    });

    const createdPhoto = useAppStore.getState().photos[0];
    expect(useAppStore.getState().photos).toHaveLength(initialCount + 1);
    expect(createdPhoto).toMatchObject({
      buildingId: questBuildingIds[0],
      buildingName: "Quest Building",
      year: 1995,
      imageUrl: "/photos/original.jpg",
      caption: "Original caption",
      likes: 0,
      liked: false,
      comments: [],
      uploadedAt: "2026-04-16T12:00:00.000Z",
    });

    useAppStore.getState().updatePhotoImage(createdPhoto.id, "/photos/updated.jpg");
    useAppStore.getState().updatePhotoDetails(createdPhoto.id, {
      caption: "Updated caption",
      year: 2001,
    });
    useAppStore.getState().toggleLike(createdPhoto.id);
    useAppStore.getState().toggleLike(createdPhoto.id);
    useAppStore.getState().addComment(createdPhoto.id, "Great archive find");

    const updatedPhoto = useAppStore.getState().photos.find((photo) => photo.id === createdPhoto.id);
    expect(updatedPhoto).toMatchObject({
      imageUrl: "/photos/updated.jpg",
      caption: "Updated caption",
      year: 2001,
      likes: 0,
      liked: false,
    });
    expect(updatedPhoto?.comments).toHaveLength(1);
    expect(updatedPhoto?.comments[0]).toMatchObject({
      text: "Great archive find",
      author: "You",
      createdAt: "2026-04-16T12:00:00.000Z",
    });

    useAppStore.getState().deletePhoto(createdPhoto.id);
    expect(useAppStore.getState().photos).toHaveLength(initialCount);
  });

  it("rehydrates persisted photos and sanitizes invalid stored quest stamps", async () => {
    const persistedPhoto = {
      id: "persisted-photo",
      buildingId: questBuildingIds[2],
      buildingName: "Persisted Building",
      year: 1988,
      imageUrl: "/photos/persisted.jpg",
      caption: "Persisted caption",
      uploadedAt: "1988-01-01T00:00:00.000Z",
      likes: 7,
      liked: true,
      comments: [],
    };

    window.localStorage.setItem(
      "avr-app-store",
      JSON.stringify({
        state: {
          stampCollections: {
            "guest:rehydrated": [questBuildingIds[2], nonQuestBuildingId],
          },
          photos: [persistedPhoto],
        },
        version: 5,
      })
    );

    const useAppStore = await loadStore();
    await useAppStore.persist.rehydrate();
    useAppStore.getState().setActiveUser("guest:rehydrated");

    expect(useAppStore.getState().photos[0]).toMatchObject(persistedPhoto);
    expect(Array.from(useAppStore.getState().stamps)).toEqual([questBuildingIds[2]]);
  });

  it("migrates older persisted state and only keeps valid quest stamps", async () => {
    window.localStorage.setItem(
      "avr-app-store",
      JSON.stringify({
        state: {
          stamps: [questBuildingIds[0], nonQuestBuildingId],
          stampCollections: {
            "guest:migrated": [questBuildingIds[0], nonQuestBuildingId],
          },
          photos: [],
        },
        version: 4,
      })
    );

    const useAppStore = await loadStore();
    await useAppStore.persist.rehydrate();
    useAppStore.getState().setActiveUser("guest:migrated");

    expect(Array.from(useAppStore.getState().stamps)).toEqual([questBuildingIds[0]]);

    const persisted = JSON.parse(window.localStorage.getItem("avr-app-store") ?? "{}");
    expect(persisted.state.stampCollections["guest:migrated"]).toEqual([questBuildingIds[0]]);
  });
});
