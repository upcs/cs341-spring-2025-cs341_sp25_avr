const { JSDOM } = require('jsdom');
const { getUserCords, checkWithinBounds, updateDisplay, getLocationName } = require('../public/javascripts/geo');

describe('Geo.js Tests', () => {
  let document;

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
    expect(locationName).toBe('Dundon-Berchtold Hall');
  });

  test('should return true if coordinates are within bounds', () => {
    const isWithinBounds = checkWithinBounds(
      45.5725, -122.7265, 45.572, 45.573, -122.727, -122.726
    );
    expect(isWithinBounds).toBe(true);
  });

  test('should update display with correct building name', () => {
    updateDisplay('Shiley School of Engineering');

    const popups = document.querySelectorAll('.welcome-pop-up');
    expect(popups[0].innerHTML).toContain('Shiley School of Engineering!');
  });
});

