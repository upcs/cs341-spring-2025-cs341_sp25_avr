const fs = require('fs');
const { JSDOM } = require('jsdom');
const { initializeLocation } = require('../public/javascripts/location');

const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

global.navigator.geolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
};

beforeEach(() => {
  // Mock DOM setup
  const html = `<!DOCTYPE html><html><body>
    <button id="debug-btn">Show all locations</button>
    <div class="popup" id="popup1" style="display: none;">Popup 1</div>
    <div class="popup" id="popup2" style="display: none;">Popup 2</div>
  </body></html>`;
  const dom = new JSDOM(html);
  global.document = dom.window.document;
  global.window = dom.window;

  const debugButton = document.getElementById('debug-btn');
  const popups = document.querySelectorAll('.popup');

  // Mock addEventListener
  if (debugButton) {
    debugButton.addEventListener = jest.fn((event, callback) => {
      if (event === 'click') {
        callback();
      }
    });
  }
});

afterEach(() => {
  // Reset DOM
  document.body.innerHTML = '';
  jest.clearAllMocks();
});

test('should toggle popup visibility on debug button click', () => {
  const debugButton = document.getElementById('debug-btn');
  const popups = document.querySelectorAll('.popup');

  // Simulate the "click" on the debugButton
  if (!debugButton) {
    throw new Error('debug-btn is missing from the DOM');
  }

  debugButton.dispatchEvent(new window.Event('click'));

  // Verify popups are now visible
  popups.forEach((popup) => {
    expect(popup.style.display).toBe('block'); // Changed to 'block' as common visibility style
  });
});

test('should gracefully handle missing debug button', () => {
  // Remove debugButton from DOM
  const debugButton = document.getElementById('debug-btn');
  debugButton?.remove();

  // Initialize the function and confirm no errors are thrown
  expect(() => {
    initializeLocation();
  }).not.toThrow();
});



