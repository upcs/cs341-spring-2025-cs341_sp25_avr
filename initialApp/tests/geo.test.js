const { JSDOM } = require("jsdom");
const {
  getUserCords,
  checkWithinBounds,
  updateDisplay,
} = require("../public/javascripts/geo");

describe("Geo.js Tests", () => {
  let map, details, message, loader, popups, devButton;

  beforeEach(() => {
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
          <button id="debug-btn">Debug</button>
        </body>
      </html>`;
    const dom = new JSDOM(html);
    global.document = dom.window.document;

    map = document.getElementById("map");
    details = document.getElementById("details");
    message = document.querySelectorAll(".default-message");
    loader = document.querySelector(".loader");
    popups = document.querySelectorAll(".welcome-pop-up");
    devButton = document.getElementById("debug-btn");
  });

  afterEach(() => {
    jest.clearAllMocks();
    global.document = undefined;
  });

  // Helper function to mock geolocation
  const mockGeolocation = (success, error) => {
    global.navigator.geolocation = {
      getCurrentPosition: jest.fn((successCallback, errorCallback) =>
        success ? successCallback(success) : errorCallback(error)
      ),
    };
  };

  test("should attach event listener to devButton and display popups", () => {
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

  test("should update map and details with user coordinates", () => {
    const mockPosition = {
      coords: { latitude: 45.5725, longitude: -122.7265 },
    };

    mockGeolocation(mockPosition, null);

    getUserCords();

    // Verify map iframe is updated
    expect(map.innerHTML).toContain(
      `https://maps.google.com/maps?q=${mockPosition.coords.latitude},${mockPosition.coords.longitude}`
    );

    // Verify details are updated
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

    getUserCords();

    expect(consoleSpy).toHaveBeenCalledWith(
      "Error getting location: ",
      mockError
    );
    consoleSpy.mockRestore();
  });

  test("should check if user is within bounds", () => {
    const lat = 45.5723;
    const long = -122.7275;
    const latMin = 45.5713;
    const latMax = 45.5724;
    const longMin = -122.7287;
    const longMax = -122.7272;

    const result = checkWithinBounds(lat, long, latMin, latMax, longMin, longMax);

    expect(result).toBe(true);
  });

  test("should return false if user is outside bounds", () => {
    const lat = 45.5700;
    const long = -122.7300;
    const latMin = 45.5713;
    const latMax = 45.5724;
    const longMin = -122.7287;
    const longMax = -122.7272;

    const result = checkWithinBounds(lat, long, latMin, latMax, longMin, longMax);

    expect(result).toBe(false);
  });

  test("should update display with building name", () => {
    updateDisplay("Shiley School of Engineering");

    // Verify updates to messages
    expect(message[0].style.display).toBe("flex");
    expect(message[0].innerHTML).toBe("Near by buildings:");
    expect(message[1].style.display).toBe("flex");

    // Verify loader is hidden
    expect(loader.style.display).toBe("none");

    // Verify popup shows correct building name
    expect(popups[0].style.display).toBe("flex");
    expect(popups[0].innerHTML).toBe("Shiley School of Engineering!");
  });

  test("should handle missing map element", () => {
    global.document.getElementById = jest.fn((id) =>
      id === "map" ? null : {}
    );

    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    getUserCords();

    expect(consoleSpy).toHaveBeenCalledWith(
      "Element with id 'map' not found."
    );
    consoleSpy.mockRestore();
  });
});
