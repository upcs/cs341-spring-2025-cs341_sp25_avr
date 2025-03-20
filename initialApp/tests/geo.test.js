const { JSDOM } = require('jsdom');
const { getUserCords, checkWithinBounds, updateDisplay } = require('../public/javascripts/geo');

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
    jest.clearAllMocks(); // Reset mocks after each test
  });

  test('should update #details with coordinates on successful geolocation', () => {
    getUserCords();

    const details = document.getElementById('details');
    expect(details.innerHTML).toContain('Latitude: 45.5725');
    expect(details.innerHTML).toContain('Longitude: -122.7265');
  });

  test('should return true if user is within bounds of a building', () => {
    const isWithinBounds = checkWithinBounds(
      45.5724, -122.7272, 45.5713, 45.5724, -122.7287, -122.7272
    );
    expect(isWithinBounds).toBe(true);
  });

  test('should call updateDisplay with correct building name', () => {
    const building = "Shiley School of Engineering";
    const message = document.querySelectorAll('.welcome-pop-up');
    updateDisplay(building);

    expect(message[0].innerHTML).toContain(`${building}!`);
  });

  test('should log an error if geolocation fails', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    global.navigator.geolocation.getCurrentPosition.mockImplementationOnce((_, error) =>
      error({ code: 1, message: 'Geolocation error' })
    );

    getUserCords();

    expect(consoleSpy).toHaveBeenCalledWith('Error getting location:', {
      code: 1,
      message: 'Geolocation error',
    });

    consoleSpy.mockRestore();
  });
});

