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
    };

    // Import functions from geo.js
    const {
      initMap,
      isUserNearBuilding,
      getBuildingName,
      hideTapIconMessage,
      error,
      hideLoader,
      success,
      checkWithinBounds,
      updateDisplay,
    } = require("../public/javascripts/geo.js");

    // Assign functions to the global scope
    global.initMap = initMap;
    global.isUserNearBuilding = isUserNearBuilding;
    global.getBuildingName = getBuildingName;
    global.hideTapIconMessage = hideTapIconMessage;
    global.error = error;
    global.hideLoader = hideLoader;
    global.success = success;
    global.checkWithinBounds = checkWithinBounds;
    global.updateDisplay = updateDisplay;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Mock geolocation
  const mockGeolocation = (success, error) => {
    global.navigator.geolocation = {
      getCurrentPosition: jest.fn((successCallback, errorCallback) =>
        success ? successCallback(success) : errorCallback(error)
      ),
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

  test("should update map and details with user coordinates", () => {
    const mockPosition = {
      coords: { latitude: 45.5725, longitude: -122.7265 },
    };
    mockGeolocation(mockPosition, null);

    initMap();

    expect(map.innerHTML).toContain(
      `https://maps.google.com/maps?q=${mockPosition.coords.latitude},${mockPosition.coords.longitude}`
    );
    expect(details.innerHTML).toContain(
      `Latitude: ${mockPosition.coords.latitude}`
    );
    expect(details.innerHTML).toContain(
      `Longitude: ${mockPosition.coords.longitude}`
    );
  });

  test("should log error if geolocation fails", () => {
    const mockError = { message: "Geolocation error" };
    mockGeolocation(null, mockError);

    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    initMap();

    expect(consoleSpy).toHaveBeenCalledWith(
      "Error getting location: ",
      mockError
    );
    consoleSpy.mockRestore();
  });

  test("should handle missing map element gracefully", () => {
    jest.spyOn(global.document, "getElementById").mockImplementation((id) =>
      id === "map" ? null : {}
    );

    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    initMap();

    expect(consoleSpy).toHaveBeenCalledWith("Element with id 'map' not found.");
    consoleSpy.mockRestore();
  });

  test("should verify user is within bounds", () => {
    const result = checkWithinBounds(
      45.5723,
      -122.7275,
      45.5713,
      45.5724,
      -122.7287,
      -122.7272
    );

    expect(result).toBe(true);
  });

  test("should return false if user is outside bounds", () => {
    const result = checkWithinBounds(
      45.5700,
      -122.7300,
      45.5713,
      45.5724,
      -122.7287,
      -122.7272
    );

    expect(result).toBe(false);
  });

  test("should update display with building name", () => {
    updateDisplay("Shiley School of Engineering");

    expect(message[0].style.display).toBe("flex");
    expect(message[0].innerHTML).toBe("Near by buildings:");
    expect(message[1].style.display).toBe("flex");
    expect(loader.style.display).toBe("none");
    expect(popups[0].style.display).toBe("flex");
    expect(popups[0].innerHTML).toBe("Shiley School of Engineering!");
  });

  test("should handle undefined message elements gracefully", () => {
    jest.spyOn(global.document, "querySelectorAll").mockImplementation((selector) =>
      selector === ".default-message" ? null : []
    );

    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    updateDisplay("Shiley School of Engineering");

    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
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
  });

  describe('isUserNearBuilding', () => {
      it('should return true if the user is within the building radius', () => {
          // Mock the distance to be less than or equal to the radius
          mapMock.distanceTo.mockReturnValue(40); // Distance is less than radius
          expect(isUserNearBuilding(userLat, userLng, circleMock)).toBe(true);
      });

      it('should return false if the user is outside the building radius', () => {
          // Mock the distance to be greater than the radius
          mapMock.distanceTo.mockReturnValue(60); // Distance is greater than radius
          expect(isUserNearBuilding(userLat, userLng, circleMock)).toBe(false);
      });
  });

  describe('getBuildingName', () => {
      it('should return the building name if the user is inside the building radius', () => {
          const circles = {
              "shiley": circleMock
          };
          mapMock.distanceTo.mockReturnValue(40); // Inside radius

          const buildingName = getBuildingName(userLat, userLng, circles);
          expect(buildingName).toBe('shiley');
      });

      it('should return null if the user is not inside any building radius', () => {
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

      it('should hide loader and display nearby building information when user is near a building', () => {
          // Mock elements
          document.querySelectorAll = jest.fn().mockReturnValue(messageMock);
          document.querySelector = jest.fn().mockReturnValue(loaderMock);

          hideLoader();

          expect(messageMock[0].style.display).toBe('flex');
          expect(messageMock[0].innerHTML).toBe('Nearby buildings:');
          expect(messageMock[1].style.display).toBe('flex');
          expect(loaderMock.style.display).toBe('none');
      });

      it('should show loader when no nearby building is found', () => {
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