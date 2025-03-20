const { JSDOM } = require('jsdom');
const { initializeLocation, togglePopups } = require('../public/javascripts/location');

// Helper function to assert visibility
function assertPopupVisibility(popups, expectedDisplay, expectedAriaHidden) {
  popups.forEach((popup) => {
    expect(popup.style.display).toBe(expectedDisplay);
    expect(popup.getAttribute('aria-hidden')).toBe(expectedAriaHidden);
  });
}

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
  const event = new Event('click');
  debugButton.dispatchEvent(event);

  // Verify all popups are now visible
  assertPopupVisibility(popups, 'block', 'false');

  // Simulate another click event to toggle visibility
  debugButton.dispatchEvent(event);
  assertPopupVisibility(popups, 'none', 'true');
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

test('should handle a single popup in the DOM', () => {
  // Remove all but one popup
  document.querySelectorAll('.popup').forEach((popup, index) => {
    if (index > 0) popup.remove();
  });

  const debugButton = document.getElementById('debug-btn');
  expect(debugButton).not.toBeNull();

  // Simulate a click event
  const event = new Event('click');
  debugButton.dispatchEvent(event);

  // Verify the single popup visibility
  const popup = document.querySelector('.popup');
  expect(popup.style.display).toBe('block');
  expect(popup.getAttribute('aria-hidden')).toBe('false');

  debugButton.dispatchEvent(event);

  expect(popup.style.display).toBe('none');
  expect(popup.getAttribute('aria-hidden')).toBe('true');
});
test('debug DOM structure to verify debug-btn existence', () => {
  // Log the current DOM structure
  console.log(document.body.innerHTML); // Prints the DOM structure for debugging

  // Check if the debug button exists in the DOM
  const debugButton = document.getElementById('debug-btn');
  expect(debugButton).not.toBeNull(); // Assert that the debug button exists

  // Log further details for the debug button if needed
  console.log('Debug button found:', debugButton); // Logs the debug button element
});
