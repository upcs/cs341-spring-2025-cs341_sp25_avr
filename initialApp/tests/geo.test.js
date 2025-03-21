const { JSDOM } = require("jsdom");
const { getUserCords, checkWithinBounds } = require("../public/javascripts/geo");

describe("Geo.js Tests", () => {
  let document, map, details, debugButton, loader, popups, message;

  beforeEach(() => {
    const html = `
      <!DOCTYPE html>
      <html>
        <body>
          <div id="map"></div>
          <div id="details"></div>
          <div class="loader"></div>
          <div class="popup welcome-pop-up" style="display: none;">Popup 1</div>
          <div class="popup welcome-pop-up" style="display: none;">Popup 2</div>
          <div class="default-message">Message 1</div>
          <div class="default-message" style="color: gray;">Message 2</div>
          <button id="debug-btn">Debug</button>
        </body>
      </html>`;
    const dom = new JSDOM(html);
    global.document = dom.window.document;

    // Reference DOM elements
    map = document.getElementById("map");
    details = document.getElementById("details");
    loader = document.querySelector(".loader");
    popups = document.querySelectorAll(".welcome-pop-up");
    message = document.querySelectorAll(".default-message");
    debugButton = document.getElementById("debug-btn");

    // Mock navigator.geolocation
    global.navigator.geolocation = {
      getCurrentPosition: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
    global.document = undefined;
    global.navigator = undefined;
  });

  test("should display map and update details with coordinates", () => {
    const mockPosition = {
      coords: { latitude: 45.5725, longitude: -122.7265 },
    };

    global.navigator.geolocation.getCurrentPosition.mockImplementation((success) =>
      success(mockPosition)
    );

    getUserCords();

    expect(map.innerHTML).toContain("iframe");
    expect(details.innerHTML).toContain("Latitude: 45.5725");
    expect(details.innerHTML).toContain("Longitude: -122.7265");
  });

  test("should toggle popups when debug button is clicked", () => {
    debugButton.addEventListener("click", () => {
      popups.forEach((popup) => {
        popup.style.display = popup.style.display === "none" ? "flex" : "none";
      });
    });

    debugButton.click();

    popups.forEach((popup) => {
      expect(popup.style.display).toBe("flex");
    });

    debugButton.click();

    popups.forEach((popup) => {
      expect(popup.style.display).toBe("none");
    });
  });

  test("should update display with building name", () => {
    const building = "Shiley School of Engineering";

    message[0].style.display = "flex";
    message[0].innerHTML = "Near by buildings:";
    loader.style.display = "none";
    popups[0].style.display = "flex";
    popups[0].innerHTML = `${building}!`;

    expect(message[0].style.display).toBe("flex");
    expect(message[0].innerHTML).toBe("Near by buildings:");
    expect(loader.style.display).toBe("none");
    expect(popups[0].style.display).toBe("flex");
    expect(popups[0].innerHTML).toBe("Shiley School of Engineering!");
  });

  test("should return false for checkWithinBounds if outside bounds", () => {
    const result = checkWithinBounds(0, 0, 45.5713, 45.5724, -122.7287, -122.7272);
    expect(result).toBe(false);
  });

  test("should return true for checkWithinBounds if inside bounds", () => {
    const result = checkWithinBounds(45.5720, -122.7275, 45.5713, 45.5724, -122.7287, -122.7272);
    expect(result).toBe(true);
  });

  test("should log error if geolocation fails", () => {
    const mockError = { message: "Geolocation error" };

    global.navigator.geolocation.getCurrentPosition.mockImplementation((_, error) =>
      error(mockError)
    );

    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    getUserCords();

    expect(consoleSpy).toHaveBeenCalledWith("Geolocation error:", mockError);
    consoleSpy.mockRestore();
  });

  test("should log error when map element is missing", () => {
    document.getElementById = jest.fn((id) => (id === "map" ? null : {}));
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    getUserCords();

    expect(consoleSpy).toHaveBeenCalledWith("Element with id 'map' not found.");
    consoleSpy.mockRestore();
  });
});
