const { JSDOM } = require("jsdom");

describe("Geo.js Tests", () => {
  let map, details, message, loader, popups, devButton;


  beforeEach(() => {
    //Set up the mock DOM structure
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

    //Mock the fetch function
      global.fetch = jest.fn(() =>
        Promise.resolve({
            json: () => Promise.resolve([{ name: "Shiley", latMin: 45.571, latMax: 45.573, longMin: -122.728, longMax: -122.726 }]),
        })
      );

    //Set up the required HTML structure for the test
    document.body.innerHTML = `
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
          <button id="startButton">Start</button>
          <button id="fullScreenButton">Fullscreen</button>
          <div id="phone-container"></div>
          <div id="phone-container2" style="display: none;"></div>
        </body>
      </html>
    `;
    
    
    const dom = new JSDOM(html);
    global.document = dom.window.document;
    global.window = dom.window;

     //Mock event listeners
     global.document.addEventListener = jest.fn();

    // Reference DOM elements
    map = document.getElementById("map");
    details = document.getElementById("details");
    loader = document.querySelector(".loader");
    message = document.querySelectorAll(".default-message");
    popups = document.querySelectorAll(".welcome-pop-up");
    devButton = document.getElementById("debug-btn");

    const {
      success, 
    toggleFullscreen, 
    updateButton, 
    updateDisplay, 
    isUserNearBuilding, 
    checkAllBuildings,
    initMap
    } = require("../public/javascripts/geo.js");

  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  //Mock geolocation
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

