const { JSDOM } = require('jsdom');
const { getUserCords, checkWithinBounds, updateDisplay } = require('../public/javascripts/geo');

describe('Geolocation Tests', () => {
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
    document = dom.window.document;
    global.document = document;
    global.window = dom.window;
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clean up mocks after each test
  });

  it('should update #details element with latitude and longitude on successful geolocation', () => {
    // Mock successful geolocation
    global.navigator.geolocation = {
      getCurrentPosition: jest.fn((success) =>
        success({
          coords: { latitude: 40.7128, longitude: -74.0060 },
        })
      ),
    };

    // Call function
    getUserCords();

    // Verify DOM updates
    const details = document.getElementById('details');
    expect(details.innerHTML).toContain('Latitude: 40.7128');
    expect(details.innerHTML).toContain('Longitude: -74.0060');
  });

  it('should log an error and not update details if geolocation fails', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Mock geolocation failure
    global.navigator.geolocation = {
      getCurrentPosition: jest.fn((_, error) =>
        error({ code: 1, message: 'User denied geolocation' })
      ),
    };

    getUserCords();

    const details = document.getElementById('details');
    expect(details.innerHTML).toBe(''); // No changes to details
    expect(consoleSpy).toHaveBeenCalledWith('Error getting location:', {
      code: 1,
      message: 'User denied geolocation',
    });

    consoleSpy.mockRestore();
  });

  it('should log an error if #details element is missing', () => {
    // Remove the #details element
    document.getElementById('details').remove();

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Mock successful geolocation
    global.navigator.geolocation = {
      getCurrentPosition: jest.fn((success) =>
        success({
          coords: { latitude: 45.5725, longitude: -122.7265 },
        })
      ),
    };

    getUserCords();

    expect(consoleSpy).toHaveBeenCalledWith(
      "Element with id 'details' not found."
    );

    consoleSpy.mockRestore();
  });

  it('should check if user is within bounds of a specific building', () => {
    const isWithinBounds = checkWithinBounds(
      45.5724, // Latitude within the range
      -122.7272, // Longitude within the range
      45.5713, // Min latitude
      45.5724, // Max latitude
      -122.7287, // Min longitude
      -122.7272 // Max longitude
    );

    expect(isWithinBounds).toBe(true);
  });

  it('should toggle popups on debug button click', () => {
    const debugButton = document.getElementById('debug-btn');
    const popups = document.querySelectorAll('.welcome-pop-up');

    // Ensure popups are initially hidden
    popups.forEach((popup) => {
      expect(popup.style.display).toBe('none');
    });

    // Simulate button click
    debugButton.dispatchEvent(new window.Event('click'));

    // Verify popups are now visible
    popups.forEach((popup) => {
      expect(popup.style.display).toBe('flex');
    });
  });

  it('should call updateDisplay with correct building name', () => {
    // Spy on updateDisplay
    const spyUpdateDisplay = jest.spyOn(global, 'updateDisplay');

    // Mock buildings
    const building = 'Shiley School of Engineering';

    // Call updateDisplay
    updateDisplay(building);

    // Verify popup content
    const popups = document.querySelectorAll('.welcome-pop-up');
    expect(popups[0].innerHTML).toContain(`${building}!`);
    spyUpdateDisplay.mockRestore();
  });
});

