import { describe, expect, it } from "vitest";
import {
  archivePhotos,
  buildingContent,
  buildings,
  CAMPUS_CENTER,
  DEFAULT_ZOOM,
  isKnownBrokenArchiveImage,
  resolveDisplayImagePath,
} from "@/data/geoTable";

describe("geoTable archive data", () => {
  it("exports campus coordinates, buildings, parsed timeline content, and filtered archive photos", () => {
    expect(CAMPUS_CENTER).toMatchObject({ lat: expect.any(Number), lng: expect.any(Number) });
    expect(DEFAULT_ZOOM).toBeGreaterThan(0);
    expect(buildings.length).toBeGreaterThanOrEqual(12);

    expect(buildingContent.shiley.length).toBeGreaterThan(0);
    expect(buildingContent.shiley[0]).toMatchObject({
      buildingId: "shiley",
      year: expect.any(Number),
      description: expect.any(String),
    });

    expect(archivePhotos.length).toBeGreaterThan(0);
    expect(archivePhotos.every((photo) => photo.imageUrl && !isKnownBrokenArchiveImage(photo.imageUrl))).toBe(true);
  });

  it("normalizes known broken archive image paths across slash and case variations", () => {
    expect(isKnownBrokenArchiveImage("/archiveContent/shiley/1969.jpg")).toBe(true);
    expect(isKnownBrokenArchiveImage("\\archiveContent\\SHILEY\\1969.jpg")).toBe(true);
    expect(isKnownBrokenArchiveImage("/archiveContent/shiley/1948.jpg")).toBe(false);
    expect(isKnownBrokenArchiveImage(null)).toBe(false);
  });

  it("falls back broken archive paths to a valid image from the same building when possible", () => {
    expect(resolveDisplayImagePath("/archiveContent/buckley/2019.jpg")).toMatch(/buckley/i);
    expect(resolveDisplayImagePath("/archiveContent/buckley/2019.jpg")).not.toContain("2019.jpg");
  });

  it("falls back to a generic campus image when a building has no valid archive image left", () => {
    expect(resolveDisplayImagePath("/archiveContent/library/2013.jpg")).toBe("/images/up-campus.jpg");
  });

  it("uses the real Beauchamp image when the asset exists", () => {
    expect(isKnownBrokenArchiveImage("/archiveContent/beauchamp/2015.jpg")).toBe(false);
    expect(resolveDisplayImagePath("/archiveContent/beauchamp/2015.jpg")).toMatch(/beauchamp|2015/i);
    expect(resolveDisplayImagePath("/archiveContent/beauchamp/2015.jpg")).not.toBe("/images/up-campus.jpg");
  });
});
