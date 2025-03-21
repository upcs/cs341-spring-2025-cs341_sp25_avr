const { JSDOM } = require('jsdom');
const { getUserCords, checkWithinBounds, updateDisplay, getLocationName, updateMap, updateDetails } = require('../public/javascripts/geo');

describe('Geo.js Tests', () => {
  let document, map, details, debugButton, popups, messages;

  beforeEach(() => {
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
          <div class="default-message">Default Message 1</div>
          <div class="default-message">Default Message 2</div>
          <div class="loader"></div>
        </body>
      </html>`;
    const dom = new JSDOM(html);
    global.document = dom.window.document;
    global.window = dom.window;

    // Mock browser APIs
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

    // Reference DOM elements
    map = document.getElementById('map');
    details = document.getElementById('details');
    debugButton = document.getElementById('debug-btn');
    popups = document.querySelectorAll('.welcome-pop-up');
    messages = document.querySelectorAll('.default-message');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should update #details with coordinates on successful geolocation', () => {
    getUserCords();

    expect(details.innerHTML).toContain('Latitude: 45.5725');
    expect(details.innerHTML).toContain('Longitude: -122.7265');
  });

  test('should return correct location name for valid coordinates', () => {
    const locationName = getLocationName(45.5725, -122.7265);
    expect(locationName).toBe('Clark Library');
  });

  test('should update map with correct iframe for coordinates', () => {
    updateMap(45.5725, -122.7265);

    expect(map.innerHTML).toContain('iframe');
    expect(map.innerHTML).toContain('45.5725');
    expect(map.innerHTML).toContain('-122.7265');
  });

  test('should update display with correct building name', () => {
    updateDisplay('Shiley School of Engineering');

    expect(popups[0].innerHTML).toContain('Shiley School of Engineering!');
    expect(popups[0].style.display).toBe('flex');
  });

  test('should handle geolocation not supported', () => {
    global.navigator.geolocation = undefined;

    expect(() => getUserCords()).toThrow("Geolocation is not supported by this browser.");
  });

  test('should handle missing #details element gracefully', () => {
    details.parentNode.removeChild(details);

    expect(() => updateDetails(45.5725, -122.7265)).not.toThrow();
  });

  test('should toggle all popups when debug button is clicked', () => {
    debugButton.click();

    popups.forEach((popup) => {
      expect(popup.style.display).toBe('flex');
    });

    debugButton.click();

    popups.forEach((popup) => {
      expect(popup.style.display).toBe('none');
    });
  });

  test('should correctly identify bounds at the edges', () => {
    expect(checkWithinBounds(45.5724, -122.7287, 45.5713, 45.5724, -122.7287, -122.7272)).toBe(true);
    expect(checkWithinBounds(45.5713, -122.7272, 45.5713, 45.5724, -122.7287, -122.7272)).toBe(true);
  });

  test('should return "Location not recognized" for invalid coordinates', () => {
    const locationName = getLocationName(0, 0);
    expect(locationName).toBe('Location not recognized');
  });

  test('should handle geolocation error', () => {
    global.navigator.geolocation.getCurrentPosition = jest.fn((_, error) =>
      error({ message: 'User denied geolocation' })
    );

    expect(() => getUserCords()).not.toThrow();
  });

  test('should update loader and message visibility', () => {
    updateDisplay('Clark Library');

    expect(messages[0].style.display).toBe('flex');
    expect(messages[0].innerHTML).toContain('Nearby buildings:');
    expect(messages[1].style.display).toBe('flex');
  });
});
