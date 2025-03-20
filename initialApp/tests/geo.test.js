const { JSDOM } = require('jsdom');
const { getUserCords, checkWithinBounds, updateDisplay, getLocationName } = require('../public/javascripts/geo');

describe('Geo.js Tests', () => {
  let document;

  beforeEach(() => {
    // Mock HTML structure
    const html = `
      <!DOCTYPE html>
      <html>
        <body>
          <div id="details"></div>
          <div id="map"></div>
          <div class="popup-container">
            <div class="welcome-pop-up" style="display: none;">Popup 1</div>
            <div class="welcome-pop-up" style="display: none;">Popup 2</div>
          </div>
          <button id="debug-btn">Show all locations</button>
        </body>
      </html>`;
    const dom = new JSDOM(html);
    global.document = dom.window.document;
    global.window = dom.window;

    // Mock Geolocation API
    global.navigator.geolocation = {
      getCurrentPosition: jest.fn((success) =>
        success({
          coords: {
            latitude: 45.5725,
            longitude: -122.7265,
          },
        })
      ),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should update #details with coordinates on successful geolocation', () => {
    getUserCords();

    const details = document.getElementById('details');
    expect(details.innerHTML).toContain('Latitude: 45.5725');
    expect(details.innerHTML).toContain('Longitude: -122.7265');
  });

  test('should return correct location name for valid coordinates', () => {
    const locationName = getLocationName(45.5725, -122.7265);
    expect(locationName).toBe('Clark Library'); // Update expected name based on your cords object
  });

  test('should return true if coordinates are within bounds', () => {
    const isWithinBounds = checkWithinBounds(
      45.5725, -122.7265, 45.572, 45.573, -122.727, -122.726
    );
    expect(isWithinBounds).toBe(true);
  });

  test('should return false if coordinates are out of bounds', () => {
    const isWithinBounds = checkWithinBounds(
      45.5700, -122.7300, 45.572, 45.573, -122.727, -122.726
    );
    expect(isWithinBounds).toBe(false);
  });

  test('should update display with correct building name', () => {
    updateDisplay('Shiley School of Engineering');

    const popups = document.querySelectorAll('.welcome-pop-up');
    expect(popups[0].innerHTML).toContain('Shiley School of Engineering!');
    expect(popups[0].style.display).toBe('flex');
  });

  test('should toggle popups on debug button click', () => {
    const button = document.getElementById('debug-btn');
    const popups = document.querySelectorAll('.welcome-pop-up');

    // Initial state
    expect(popups[0].style.display).toBe('none');

    // Simulate button click
    button.click();

    // Updated state
    expect(popups[0].style.display).toBe('flex');
  });

  test('should handle geolocation not supported', () => {
    // Remove the geolocation API
    global.navigator.geolocation = undefined;

    expect(() => getUserCords()).toThrow("Geolocation is not supported by this browser.");
  });

  test('should handle missing #map element gracefully', () => {
    const mapElement = document.getElementById('map');
    mapElement.parentNode.removeChild(mapElement); // Remove map element

    expect(() => updateMap(45.5725, -122.7265)).not.toThrow();
  });

  test('should handle missing #details element gracefully', () => {
    const detailsElement = document.getElementById('details');
    detailsElement.parentNode.removeChild(detailsElement); // Remove details element

    expect(() => updateDetails(45.5725, -122.7265)).not.toThrow();
  });
});
