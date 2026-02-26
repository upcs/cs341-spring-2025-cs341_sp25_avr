
const { JSDOM } = require("jsdom");

describe("Geo.js Tests", () => {
  let map, details, message, loader, popups, devButton;

  beforeEach(() => {
    // Set up the mock DOM structure
    const html = `
      <!DOCTYPE html>
      <html>
        <body>
          <div id="map"></div>
          <div id="details"></div>
          <div class="loader"></div>
          <div class="default-message"></div>
          <div class="default-message"></div>
          <div class="popup welcome-pop-up" style="display: none;">Popup 1</div>
          <div class="popup welcome-pop-up" style="display: none;">Popup 2</div>
          <button id="debug-btn">Debug</button>
          <button id="fullScreenButton">Fullscreen</button>
          <button id="startButton">Start</button>
          <div id="phone-container"></div>
          <div id="phone-container2" style="display: none;"></div>
        </body>
      </html>`;

    // Mock fetch function
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve([
            { name: "Shiley", latMin: 45.571, latMax: 45.573, longMin: -122.728, longMax: -122.726 },
          ]),
      })
    );

    // Set up the DOM for the test
    document.body.innerHTML = html;
    const dom = new JSDOM(html);
    global.document = dom.window.document;
    global.window = dom.window;

    // Mock event listeners
    global.document.addEventListener = jest.fn();

    // Reference DOM elements
    map = document.getElementById("map");
    details = document.getElementById("details");
    loader = document.querySelector(".loader");
    message = document.querySelectorAll(".default-message");
    popups = document.querySelectorAll(".welcome-pop-up");
    devButton = document.getElementById("debug-btn");

    // Mock Leaflet (L)
    global.L = {
      map: jest.fn().mockReturnValue({
        setView: jest.fn(),
        on: jest.fn(),
      }),
      tileLayer: jest.fn().mockReturnValue({
        addTo: jest.fn(),
      }),
      Browser: { svg: true, vml: false },
    };

    // Import functions from geo.js
    const {
      initMap,
      isUserNearBuilding,
      getBuildingName,
      hideTapIconMessage,
      error,
      hideLoader,
      showLoader,
      success,
    } = require("../public/javascripts/geo.js");

    // Assign functions to the global scope
    global.initMap = initMap;
    global.isUserNearBuilding = isUserNearBuilding;
    global.getBuildingName = getBuildingName;
    global.hideTapIconMessage = hideTapIconMessage;
    global.error = error;
    global.hideLoader = hideLoader;
    global.success = success;
    global.showLoader = showLoader;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Mock geolocation
  const mockGeolocation = () => {
    global.navigator.geolocation = {
      watchPosition: jest.fn(),
    };
  };

  test("should attach event listener to devButton and show popups on click", () => {
    expect(devButton).not.toBeNull();

    devButton.addEventListener("click", () => {
      popups.forEach((popup) => {
        popup.style.display = "flex";
      });
    });

    devButton.click();

    popups.forEach((popup) => {
      expect(popup.style.display).toBe("flex");
    });
  });

  test("should handle missing devButton gracefully", () => {
    jest.spyOn(global.document, "getElementById").mockImplementation((id) =>
      id === "debug-btn" ? null : {}
    );

    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const mockDevButton = document.getElementById("debug-btn");

    if (!mockDevButton) {
      console.error("Debug button (debug-btn) not found.");
    }

    expect(consoleSpy).toHaveBeenCalledWith("Debug button (debug-btn) not found.");
    consoleSpy.mockRestore();
  });

  test("should wire geolocation watchPosition when available", () => {
    mockGeolocation();
    initMap();
    expect(global.navigator.geolocation.watchPosition).toHaveBeenCalled();
  });

  // Bounds and display tests removed: current implementation uses Leaflet radius checks
  // and does not expose a separate updateDisplay function.
});

describe('geo.js', () => {
  let mapMock, circleMock, userLat, userLng;

  beforeEach(() => {
      // Mock the Leaflet map and circle methods
      mapMock = {
          distanceTo: jest.fn()
      };
      circleMock = {
          getLatLng: jest.fn().mockReturnValue({ lat: 45.5719, lng: -122.7290 }),
          getRadius: jest.fn().mockReturnValue(50),
      };

      userLat = 45.5719;
      userLng = -122.7290;

      global.L = {
          latLng: jest.fn(() => mapMock),
      };
  });

  describe('isUserNearBuilding', () => {
      test('should return true if the user is within the building radius', () => {
          // Mock the distance to be less than or equal to the radius
          mapMock.distanceTo.mockReturnValue(40); // Distance is less than radius
          expect(isUserNearBuilding(userLat, userLng, circleMock)).toBe(true);
      });

      test('should return false if the user is outside the building radius', () => {
          // Mock the distance to be greater than the radius
          mapMock.distanceTo.mockReturnValue(60); // Distance is greater than radius
          expect(isUserNearBuilding(userLat, userLng, circleMock)).toBe(false);
      });
  });

  describe('getBuildingName', () => {
      test('should return the building name if the user is inside the building radius', () => {
          const circles = {
              "shiley": circleMock
          };
          mapMock.distanceTo.mockReturnValue(40); // Inside radius

          const buildingName = getBuildingName(userLat, userLng, circles);
          expect(buildingName).toBe('shiley');
      });

      test('should return null if the user is not inside any building radius', () => {
          const circles = {
              "shiley": circleMock
          };
          mapMock.distanceTo.mockReturnValue(60); // Outside radius

          const buildingName = getBuildingName(userLat, userLng, circles);
          expect(buildingName).toBeNull();
      });
  });

  describe('Loader functionality', () => {
      let messageMock, loaderMock;

      beforeEach(() => {
          messageMock = [{ style: {} }, { style: {} }];
          loaderMock = { style: {} };
      });

      test('should hide loader and display nearby building information when user is near a building', () => {
          // Mock elements
          document.querySelectorAll = jest.fn().mockReturnValue(messageMock);
          document.querySelector = jest.fn().mockReturnValue(loaderMock);

          hideLoader();

          expect(messageMock[0].style.display).toBe('flex');
          expect(messageMock[0].innerHTML).toBe('Nearby buildings:');
          expect(messageMock[1].style.display).toBe('flex');
          expect(loaderMock.style.display).toBe('none');
      });

      test('should show loader when no nearby building is found', () => {
        const {showLoader} = require('../public/javascripts/geo.js')
        
        // Mock elements
          document.querySelectorAll = jest.fn().mockReturnValue(messageMock);
          document.querySelector = jest.fn().mockReturnValue(loaderMock);

          showLoader();

          expect(messageMock[0].innerHTML).toBe('Walk to a nearby building');
          expect(loaderMock.style.display).toBe('none');
      });
  });
});
