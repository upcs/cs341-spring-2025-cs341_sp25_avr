const { JSDOM } = require("jsdom");
const { navigateTo } = require("../public/javascripts/menu");

describe("Menu Navigation Tests", () => {
  let mockWindow, homeButton, mapButton, geoButton;

  beforeEach(() => {
    // Mock DOM
    const html = `
      <!DOCTYPE html>
      <html>
        <body>
          <button id="home-button">Home</button>
          <button id="map-button">Map</button>
          <button id="geo-button">Geo</button>
        </body>
      </html>`;
    const dom = new JSDOM(html);
    global.document = dom.window.document;

    // Mock window
    mockWindow = { location: { href: "" } };
    global.window = mockWindow;

    // Reference buttons
    homeButton = document.getElementById("home-button");
    mapButton = document.getElementById("map-button");
    geoButton = document.getElementById("geo-button");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should attach event listeners to menu buttons and navigate correctly", () => {
    expect(homeButton).not.toBeNull();
    expect(mapButton).not.toBeNull();
    expect(geoButton).not.toBeNull();

    // Attach event listeners
    homeButton.addEventListener("click", () => navigateTo("home"));
    mapButton.addEventListener("click", () => navigateTo("map"));
    geoButton.addEventListener("click", () => navigateTo("geo"));

    // Simulate button clicks
    homeButton.click();
    expect(mockWindow.location.href).toBe("index.html");

    mapButton.click();
    expect(mockWindow.location.href).toBe("map.html");

    geoButton.click();
    expect(mockWindow.location.href).toBe("geo.html");
  });

  test("should handle missing menu buttons gracefully", () => {
    document.getElementById("home-button").remove();
    expect(document.getElementById("home-button")).toBeNull();
  });

  test("should gracefully handle null navigation input", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    navigateTo(null); // Simulate null input
    expect(consoleSpy).toHaveBeenCalledWith("Invalid page selection");

    consoleSpy.mockRestore();
  });
});
