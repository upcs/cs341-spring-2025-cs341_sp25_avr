const { JSDOM } = require('jsdom');
const { navigateTo } = require('../public/javascripts/menu');

describe('Menu Navigation Tests', () => {
  let dom;
  let mockWindow;

  beforeEach(() => {
    // Mock the DOM
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <button id="home-button">Home</button>
        <button id="map-button">Map</button>
        <button id="geo-button">Geo</button>
      </body>
      </html>`;
    dom = new JSDOM(html, { url: 'http://localhost/' });
    global.document = dom.window.document;
    global.window = dom.window;

    // Mock window.location.href for navigation
    mockWindow = { location: { href: '' } };
    global.window = mockWindow;
  });

  afterEach(() => {
    jest.clearAllMocks();
    global.window = undefined; // Reset global window
  });

  test('should navigate to index.html when home is selected', () => {
    navigateTo("home");

    expect(mockWindow.location.href).toBe("index.html");
  });

  test('should navigate to map.html when map is selected', () => {
    navigateTo("map");

    expect(mockWindow.location.href).toBe("map.html");
  });

  test('should navigate to geo.html when geo is selected', () => {
    navigateTo("geo");

    expect(mockWindow.location.href).toBe("geo.html");
  });

  test('should log an error for invalid page selection', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    navigateTo("invalid");

    expect(consoleSpy).toHaveBeenCalledWith("Invalid page selection");
    consoleSpy.mockRestore();
  });

  test('should attach event listeners to menu buttons and navigate correctly', () => {
    // Mock event listeners
    const homeButton = document.getElementById("home-button");
    const mapButton = document.getElementById("map-button");
    const geoButton = document.getElementById("geo-button");

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

  test('should handle missing menu buttons gracefully', () => {
    // Remove buttons from the DOM
    document.getElementById('home-button').remove();
    document.getElementById('map-button').remove();
    document.getElementById('geo-button').remove();

    // Simulate loading event
    expect(() => {
      const buttons = ['home-button', 'map-button', 'geo-button'];
      buttons.forEach((id) => {
        const button = document.getElementById(id);
        if (button) {
          button.addEventListener("click", () => navigateTo(id));
        }
      });
    }).not.toThrow();
  });

  test('should gracefully handle null navigation input', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    navigateTo(null); // Pass a null value
    expect(consoleSpy).toHaveBeenCalledWith("Invalid page selection");

    consoleSpy.mockRestore();
  });
});
