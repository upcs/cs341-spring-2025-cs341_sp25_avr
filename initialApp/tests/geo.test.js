const fs = require('fs');
const { JSDOM } = require('jsdom');
global.TextEncoder = require('util').TextEncoder; // Polyfill for TextEncoder
global.TextDecoder = require('util').TextDecoder; // Polyfill for TextDecoder

// Import the function to test
const { getUserCords } = require('../public/javascripts/geo');

describe('Geolocation Tests', () => {
  let document;

  beforeEach(() => {
    // Load HTML and setup DOM
    const html = fs.readFileSync(`${__dirname}/../public/geo.html`, 'utf8');
    const dom = new JSDOM(html);
    document = dom.window.document;
    global.document = document;
    global.window = dom.window;

    // Mock "details" div in the DOM
    const detailsDiv = document.createElement('div');
    detailsDiv.id = 'details';
    document.body.appendChild(detailsDiv);

    // Mock geolocation API
    global.navigator.geolocation = {
      getCurrentPosition: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clear mocks after each test
    document.body.innerHTML = ''; // Reset DOM
  });

  afterAll(() => {
    delete global.navigator.geolocation; // Cleanup global geolocation mock
  });

  it('updates coordinates in HTML', () => {
    // Simulate successful geolocation
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

    // Validate that DOM is updated with correct coordinates
    const details = document.getElementById('details');
    expect(details.innerHTML).toContain('Latitude: 45.5725');
    expect(details.innerHTML).toContain('Longitude: -122.7265');
  });

  it('handles geolocation errors gracefully', () => {
    // Simulate geolocation failure
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
});



