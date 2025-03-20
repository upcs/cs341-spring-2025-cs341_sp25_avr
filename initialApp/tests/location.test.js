const { JSDOM } = require('jsdom');
const { initializeLocation, togglePopups } = require('../public/javascripts/location');

beforeEach(() => {
  // Set up a mock DOM
  const html = `
    <!DOCTYPE html>
    <html>
      <body>
        <button id="debug-btn">Show all locations</button>
        <div class="popup" id="popup1" style="display: none;" aria-hidden="true">Popup 1</div>
        <div class="popup" id="popup2" style="display: none;" aria-hidden="true">Popup 2</div>
      </body>
    </html>`;
  const dom = new JSDOM(html);
  global.document = dom.window.document;
  global.window = dom.window;
});

afterEach(() => {
  jest.clearAllMocks();
  document.body.innerHTML = ''; // Reset DOM after each test
});

test('should toggle popup visibility on debug button click', () => {
  initializeLocation();

  const debugButton = document.getElementById('debug-btn');
  const popups = document.querySelectorAll('.popup');

  // Ensure the debug button exists
  expect(debugButton).not.toBeNull();

  // Simulate a click event
  const event = document.createEvent('Event');
  event.initEvent('click', true, true);
  debugButton.dispatchEvent(event);

  // Verify all popups are now visible
  popups.forEach((popup) => {
    expect(popup.style.display).toBe('block');
    expect(popup.getAttribute('aria-hidden')).toBe('false');
  });

  // Simulate another click event to toggle visibility
  debugButton.dispatchEvent(event);
  popups.forEach((popup) => {
    expect(popup.style.display).toBe('none');
    expect(popup.getAttribute('aria-hidden')).toBe('true');
  });
});

test('should gracefully handle missing debug button', () => {
  // Remove the debug button from the DOM
  const debugButton = document.getElementById('debug-btn');
  debugButton?.remove();

  const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

  initializeLocation();

  expect(consoleSpy).toHaveBeenCalledWith('Debug button (debug-btn) is not found in the DOM.');
  consoleSpy.mockRestore();
});

test('should warn if no popups are found in the DOM', () => {
  // Remove all popup elements
  document.querySelectorAll('.popup').forEach((popup) => popup.remove());

  const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

  togglePopups();

  expect(consoleSpy).toHaveBeenCalledWith('No popups (.popup) found in the DOM.');
  consoleSpy.mockRestore();
});
