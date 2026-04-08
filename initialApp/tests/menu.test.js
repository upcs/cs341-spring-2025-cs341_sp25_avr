const { navigateTo } = require("../public/javascripts/menu");

describe("Menu Navigation Tests", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <button id="home-button">Home</button>
      <button id="map-button">Map</button>
      <button id="geo-button">Geo</button>
    `;

    Object.defineProperty(window, "location", {
      configurable: true,
      writable: true,
      value: { href: "" },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("navigates to each expected page", () => {
    const homeButton = document.getElementById("home-button");
    const mapButton = document.getElementById("map-button");
    const geoButton = document.getElementById("geo-button");

    expect(homeButton).not.toBeNull();
    expect(mapButton).not.toBeNull();
    expect(geoButton).not.toBeNull();

    homeButton.addEventListener("click", () => navigateTo("home"));
    mapButton.addEventListener("click", () => navigateTo("map"));
    geoButton.addEventListener("click", () => navigateTo("geo"));

    expect(() => homeButton.click()).not.toThrow();
    expect(window.location.href).toBe("index.html");

    expect(() => mapButton.click()).not.toThrow();
    expect(window.location.href).toBe("map.html");

    expect(() => geoButton.click()).not.toThrow();
    expect(window.location.href).toBe("geo.html");
  });

  test("handles missing buttons gracefully", () => {
    document.getElementById("home-button").remove();
    expect(document.getElementById("home-button")).toBeNull();
  });

  test("logs an error for invalid navigation input", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    navigateTo(null);
    expect(consoleSpy).toHaveBeenCalledWith("Invalid page selection");

    consoleSpy.mockRestore();
  });
});
