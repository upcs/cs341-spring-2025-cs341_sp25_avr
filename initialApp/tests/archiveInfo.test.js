const { JSDOM } = require('jsdom');
const { toggleReadMore } = require('../public/javascripts/archiveInfo');

describe('Archive Info Tests', () => {
  let dom, document, readButton, archiveInfo;

  beforeEach(() => {
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
    jest.clearAllMocks();
    global.document = undefined;
    global.window = undefined;
    dom = null;
    readButton = null;
    archiveInfo = null;
  });

  test('should expand archive info and update button text', () => {
    toggleReadMore(readButton, archiveInfo);
    expect(archiveInfo.classList.contains('expanded')).toBe(true);
    expect(readButton.textContent).toBe('Read less');
  });

  test('should collapse archive info and update button text', () => {
    archiveInfo.classList.add('expanded');
    readButton.textContent = 'Read less';

    toggleReadMore(readButton, archiveInfo);

    expect(archiveInfo.classList.contains('expanded')).toBe(false);
    expect(readButton.textContent).toBe('Read more');
  });

  test('should not throw an error if button or content is not present', () => {
    expect(() => toggleReadMore(null, archiveInfo)).not.toThrow();
    expect(() => toggleReadMore(readButton, null)).not.toThrow();
    expect(() => toggleReadMore(null, null)).not.toThrow();
  });

  test('should start with collapsed archive info and default button text', () => {
    expect(archiveInfo.classList.contains('collapsed')).toBe(true);
    expect(readButton.textContent).toBe('Read more');
  });

  test('should attach event listener to readButton and toggle behavior', () => {
    document.dispatchEvent(new Event('DOMContentLoaded'));
    readButton.click();
    expect(archiveInfo.classList.contains('expanded')).toBe(true);
    expect(readButton.textContent).toBe('Read less');
  });
});

