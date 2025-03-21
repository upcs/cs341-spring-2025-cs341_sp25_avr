const { JSDOM } = require('jsdom');
const {
  getUserCords,
  checkWithinBounds,
  updateDisplay,
  getLocationName,
  updateMap,
  updateDetails,
} = require('../public/javascripts/geo');

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

  // Existing tests...

  test('should handle geolocation errors gracefully', () => {
    global.navigator.geolocation.getCurrentPosition = jest.fn((_, error) =>
      error({ message: 'User denied geolocation' })
    );

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

    expect(() => getUserCords()).not.toThrow();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Error getting location:'));
    expect(alertSpy).toHaveBeenCalledWith(
      'Unable to access location. Please enable location services and try again.'
    );

    consoleSpy.mockRestore();
    alertSpy.mockRestore();
  });

  test('should log error when geolocation is not supported', () => {
    global.navigator.geolocation = undefined;

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

    expect(() => getUserCords()).not.toThrow();
    expect(consoleSpy).toHaveBeenCalledWith(
      'Geolocation is not supported by this browser.'
    );
    expect(alertSpy).toHaveBeenCalledWith(
      'Geolocation is not supported by your browser. Please use a supported browser.'
    );

    consoleSpy.mockRestore();
    alertSpy.mockRestore();
  });

  test('should log error if map element is missing', () => {
    document.getElementById = jest.fn((id) => (id === 'map' ? null : {}));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    updateMap(45.5725, -122.7265);

    expect(consoleSpy).toHaveBeenCalledWith("Element with id 'map' not found.");
    consoleSpy.mockRestore();
  });

  test('should log error if details element is missing', () => {
    document.getElementById = jest.fn((id) => (id === 'details' ? null : {}));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    updateDetails(45.5725, -122.7265);

    expect(consoleSpy).toHaveBeenCalledWith("Element with id 'details' not found.");
    consoleSpy.mockRestore();
  });

  test('should toggle popups visibility on debug button click', () => {
    debugButton.click();

    popups.forEach((popup) => {
      expect(popup.style.display).toBe('flex');
    });

    debugButton.click();

    popups.forEach((popup) => {
      expect(popup.style.display).toBe('none');
    });
  });

  test('should return "Location not recognized" for unknown coordinates', () => {
    const locationName = getLocationName(0, 0);
    expect(locationName).toBe('Location not recognized');
  });

  test('should maintain consistent display after multiple debug button clicks', () => {
    for (let i = 0; i < 3; i++) {
      debugButton.click();

      const expectedDisplay = i % 2 === 0 ? 'flex' : 'none';
      popups.forEach((popup) => {
        expect(popup.style.display).toBe(expectedDisplay);
      });
    }
  });
});
