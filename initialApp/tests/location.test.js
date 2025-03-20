const fs = require('fs');
const { JSDOM } = require('jsdom');
const { initializeLocation } = require('../public/javascripts/location');

const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock Geolocation API
global.navigator.geolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
};

beforeEach(() => {
  // Set up a mock DOM
  const html = `
    <!DOCTYPE html>
    <html>
      <body>
        <button id="debug-btn">Show all locations</button>
        <div class="popup" id="popup1" style="display: none;">Popup 1</div>
        <div class="popup" id="popup2" style="display: none;">Popup 2</div>
      </body>
    </html>`;
  const dom = new JSDOM(html);
  global.document = dom.window.document;
  global.window = dom.window;

  // Mock the debug button and popup behavior
  const debugButton = document.getElementById('debug-btn');
  const popups = document.querySelectorAll('.popup');

  // Add mock addEventListener behavior to debug button
  if (debugButton) {
    debugButton.addEventListener = jest.fn((event, callback) => {
      if (event === 'click') {
        callback();
      }
    });
  }
});

afterEach(() => {
  // Reset the DOM and clear mocks after each test
  document.body.innerHTML = '';
  jest.clearAllMocks();
});

test('should toggle popup visibility on debug button click', () => {
  const debugButton = document.getElementById('debug-btn');
  const popups = document.querySelectorAll('.popup');

  // Ensure the debug button exists
  if (!debugButton) {
    throw new Error('debug-btn is missing from the DOM');
  }

  // Simulate a click event on the debug button
  debugButton.dispatchEvent(new window.Event('click'));

  // Verify all popups are now visible
  popups.forEach((popup) => {
    expect(popup.style.display).toBe('block'); // Ensure popups are displayed
  });
});

test('should gracefully handle missing debug button', () => {
  // Simulate the debug button being removed from the DOM
  const debugButton = document.getElementById('debug-btn');
  debugButton?.remove();

  // Initialize the function and confirm no errors are thrown
  expect(() => {
    initializeLocation();
  }).not.toThrow();
});
