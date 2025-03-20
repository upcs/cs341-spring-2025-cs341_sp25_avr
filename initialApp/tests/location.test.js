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
    <button id="devButton">Developer</button>
    <div class="popup" id="popup1" style="display: none;">Popup 1</div>
    <div class="popup" id="popup2" style="display: none;">Popup 2</div>
  </body></html>`;
  const dom = new JSDOM(html);
  global.document = dom.window.document;
  global.window = dom.window;

  const devButton = document.getElementById('devButton');
  const popups = document.querySelectorAll('.popup');

  // Mock addEventListener
  devButton.addEventListener = jest.fn((event, callback) => {
    if (event === 'click') {
      callback();
    }
  });

  // Simulate the popups being toggled on click
  popups.forEach((popup) => {
    popup.style.display = 'none';
  });
});

afterEach(() => {
  // Reset DOM
  document.body.innerHTML = '';
  jest.clearAllMocks();
});

test('should toggle popup visibility on developer button click', () => {
  const devButton = document.getElementById('devButton');
  const popups = document.querySelectorAll('.popup');

  // Simulate the "click" on the devButton
  devButton.dispatchEvent(new window.Event('click'));

  // Verify popups are now visible
  popups.forEach((popup) => {
    expect(popup.style.display).toBe('flex');
  });
});

test('should gracefully handle missing developer button', () => {
  // Remove devButton from DOM
  const devButton = document.getElementById('devButton');
  devButton?.remove();

  // Initialize the function and confirm no errors are thrown
  expect(() => {
    initializeLocation();
  }).not.toThrow();
});



