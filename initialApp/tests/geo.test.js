// Import necessary modules
const fs = require('fs');
const { JSDOM } = require('jsdom');

// Polyfill for TextEncoder and TextDecoder
const { TextEncoder, TextDecoder } = require("util");
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Import the function to test
const { getUserCords } = require('../public/javascripts/geo');

describe('Geolocation Tests', () => {
  let document;

  beforeEach(() => {
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <button id="debug-btn">Show all locations</button>
        <div class="popup" id="popup1" style="display: none;">Popup 1</div>
        <div class="popup" id="popup2" style="display: none;">Popup 2</div>
        <div id="details"></div>
        <div id="map"></div>
      </body>
      </html>`;
    const dom = new JSDOM(html);
    global.document = dom.window.document;
    global.window = dom.window;

    // Mock geolocation API
    global.navigator.geolocation = {
      getCurrentPosition: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clear all mocks after each test
    document.body.innerHTML = ''; // Reset DOM
  });

  afterAll(() => {
    delete global.navigator.geolocation; // Cleanup geolocation mock
  });

  it('updates coordinates in HTML on successful geolocation', () => {
    // Mock successful geolocation response
    navigator.geolocation.getCurrentPosition.mockImplementationOnce((success) => {
      success({
        coords: {
          latitude: 45.5725,
          longitude: -122.7265,
        },
      });
    });

    // Call the function to test
    getUserCords();

    // Validate that the DOM is updated with correct coordinates
    const details = document.getElementById('details');
    expect(details.innerHTML).toContain('Latitude: 45.5725');
    expect(details.innerHTML).toContain('Longitude: -122.7265');
  });

  it('displays an error message in the HTML on geolocation failure', () => {
    // Mock geolocation failure response
    navigator.geolocation.getCurrentPosition.mockImplementationOnce((_, error) => {
      error({
        code: 1,
        message: 'Geolocation failed',
      });
    });

    // Call the function to test
    getUserCords();

    // Validate that an error message is displayed in the DOM
    const details = document.getElementById('details');
    expect(details.innerHTML).toContain('Error: Geolocation failed');
  });

  it('displays a fallback message if geolocation is not supported', () => {
    delete global.navigator.geolocation; // Remove geolocation support

    // Call the function to test
    getUserCords();

    // Validate that a fallback message is displayed
    const details = document.getElementById('details');
    expect(details.innerHTML).toContain('Geolocation is not supported by your browser.');
  });
});
