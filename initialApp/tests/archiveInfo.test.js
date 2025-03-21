const { JSDOM } = require('jsdom');
const { toggleReadMore } = require('../public/javascripts/archiveInfo');

describe('Archive Info Tests', () => {
  let dom, document, readButton, archiveInfo;

  beforeEach(() => {
    // Set up a mock DOM
    const html = `
      <!DOCTYPE html>
      <html>
        <body>
          <button id="read-button">Read more</button>
          <div id="archive-info" class="collapsed">Some archive information.</div>
        </body>
      </html>
    `;
    dom = new JSDOM(html);
    document = dom.window.document;

    // Reference DOM elements
    readButton = document.getElementById('read-button');
    archiveInfo = document.getElementById('archive-info');
  });

  afterEach(() => {
    // Clean up after each test
    dom = null;
    document = null;
    readButton = null;
    archiveInfo = null;
  });

  test('should expand archive info and update button text', () => {
    // Call the toggleReadMore function
    toggleReadMore(readButton, archiveInfo);

    // Verify that the archive info is expanded
    expect(archiveInfo.classList.contains('expanded')).toBe(true);
    expect(readButton.textContent).toBe('Read less');
  });

  test('should collapse archive info and update button text', () => {
    // Pre-expand the archive info
    archiveInfo.classList.add('expanded');
    readButton.textContent = 'Read less';

    // Call the toggleReadMore function
    toggleReadMore(readButton, archiveInfo);

    // Verify that the archive info is collapsed
    expect(archiveInfo.classList.contains('expanded')).toBe(false);
    expect(readButton.textContent).toBe('Read more');
  });

  test('should not throw an error if button or content is not present', () => {
    expect(() => toggleReadMore(null, archiveInfo)).not.toThrow();
    expect(() => toggleReadMore(readButton, null)).not.toThrow();
    expect(() => toggleReadMore(null, null)).not.toThrow();
  });

  test('should attach event listener to readButton and toggle behavior', () => {
    // Mock the DOMContentLoaded event handler
    document.addEventListener('DOMContentLoaded', () => {
      const button = document.getElementById('read-button');
      const content = document.getElementById('archive-info');
      if (button && content) {
        button.click();
      }
    });

    // Simulate a click on the readButton
    readButton.click();

    // Verify that the archive info is toggled
    expect(archiveInfo.classList.contains('expanded')).toBe(true);
    expect(readButton.textContent).toBe('Read less');
  });
});

