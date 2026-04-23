'use strict';

const L = require('leaflet');

describe("Geo.js Additional Tests", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    document.body.innerHTML = `
      <div id="map" style="width: 400px; height: 400px;"></div>
      <button id="debug-btn">Debug</button>
      <button id="startButton">Start</button>
      <div id="phone-container" style="display:flex;"></div>
      <div id="phone-container2" style="display:none;"></div>
      <div class="default-message" style="display:flex;"></div>
      <div class="default-message" style="display:flex;"></div>
      <div class="loader" style="display:block;"></div>
      <div id="shiley" class="building-info-btn" style="display:none;"></div>
    `;

    global.alert = jest.fn();
    global.navigator.geolocation = {
      watchPosition: jest.fn(),
    };
  });

  test("error handles denied and unknown geolocation failures", () => {
    const { error } = require("../public/javascripts/geo.js");

    error({ code: 1 });
    expect(global.alert).toHaveBeenCalledWith("Please allow geolocation access");

    error({ code: 999 });
    expect(global.alert).toHaveBeenCalledWith("Cannot get current location");
  });

  test("hideTapIconMessage updates the default message styles", () => {
    const { hideTapIconMessage } = require("../public/javascripts/geo.js");
    const messages = document.querySelectorAll(".default-message");

    hideTapIconMessage();

    expect(messages[1].style.display).toBe("none");
    expect(messages[1].style.color).toBe("gray");
    expect(messages[0].style.fontSize).toBe("24px");
  });

  test("hideLoader shows nearby-building messaging", () => {
    const { hideLoader } = require("../public/javascripts/geo.js");
    const messages = document.querySelectorAll(".default-message");
    const loader = document.querySelector(".loader");

    hideLoader();

    expect(messages[0].style.display).toBe("flex");
    expect(messages[0].innerHTML).toBe("Nearby buildings:");
    expect(messages[1].style.display).toBe("flex");
    expect(loader.style.display).toBe("none");
  });

  test("isUserNearBuilding returns true only within the circle radius", () => {
    jest.spyOn(L, "latLng").mockImplementation((lat, lng) => ({
      distanceTo: ({ lat: targetLat, lng: targetLng }) =>
        lat === targetLat && lng === targetLng ? 0 : 100,
    }));

    const { isUserNearBuilding } = require("../public/javascripts/geo.js");
    const circle = {
      getLatLng: () => ({ lat: 45.5719, lng: -122.7290 }),
      getRadius: () => 30,
    };

    expect(isUserNearBuilding(45.5719, -122.7290, circle)).toBe(true);
    expect(isUserNearBuilding(45.5725, -122.7300, circle)).toBe(false);
  });

  test("getBuildingName returns the first building whose circle contains the user", () => {
    jest.spyOn(L, "latLng").mockImplementation((lat, lng) => ({
      distanceTo: ({ lat: targetLat, lng: targetLng }) =>
        lat === targetLat && lng === targetLng ? 0 : 100,
    }));

    const { getBuildingName } = require("../public/javascripts/geo.js");
    const circles = {
      shiley: {
        getLatLng: () => ({ lat: 45.571873, lng: -122.727941 }),
        getRadius: () => 30,
      },
      merlo: {
        getLatLng: () => ({ lat: 45.574691, lng: -122.727368 }),
        getRadius: () => 60,
      },
    };

    expect(getBuildingName(45.571873, -122.727941, circles)).toBe("shiley");
    expect(getBuildingName(45.580000, -122.740000, circles)).toBe(null);
  });

  test("initMap sets up the Leaflet map and starts geolocation watching", () => {
    const mapMock = {
      setView: jest.fn(),
      removeLayer: jest.fn(),
      fitBounds: jest.fn(),
    };

    jest.spyOn(L, "map").mockReturnValue(mapMock);
    jest.spyOn(L, "tileLayer").mockReturnValue({ addTo: jest.fn() });

    const { initMap } = require("../public/javascripts/geo.js");
    initMap();

    expect(L.map).toHaveBeenCalled();
    expect(L.tileLayer).toHaveBeenCalled();
    expect(global.navigator.geolocation.watchPosition).toHaveBeenCalled();
  });

  test("clicking the start button swaps screens and initializes the map once", () => {
    const mapMock = {
      setView: jest.fn(),
      removeLayer: jest.fn(),
      fitBounds: jest.fn(),
    };

    jest.spyOn(L, "map").mockReturnValue(mapMock);
    jest.spyOn(L, "tileLayer").mockReturnValue({ addTo: jest.fn() });

    require("../public/javascripts/geo.js");
    document.getElementById("startButton").click();

    expect(document.getElementById("phone-container").style.display).toBe("none");
    expect(document.getElementById("phone-container2").style.display).toBe("flex");
    expect(L.map).toHaveBeenCalledTimes(1);
  });
});
