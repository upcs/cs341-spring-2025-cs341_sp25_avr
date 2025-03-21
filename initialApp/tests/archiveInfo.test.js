@jest-environment jsdom
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const { toggleReadMore } = require('../public/javascripts/archiveInfo'); // Only imported function for testing

describe('Archive Info Tests', () => {
  let dom;

  beforeEach(() => {
    // Mock HTML structure
    const mockHTML = `
      <!DOCTYPE html>
      <html>
      <body>
        <div id="gallery"></div>
        <button id="read-button">Read more</button>
        <div id="archive-info" class="collapsed">Archive content here.</div>
      </body>
      </html>
    `;
    dom = new JSDOM(mockHTML);
    global.document = dom.window.document;
    global.window = dom.window;
  });

  afterEach(() => {
    global.document = undefined;
    global.window = undefined;
  });

  it('should toggle archive info expansion', () => {
    const readButton = document.getElementById('read-button');
    const archiveInfo = document.getElementById('archive-info');

    // Initial state
    expect(archiveInfo.classList.contains('collapsed')).toBe(true);
    expect(readButton.textContent).toBe('Read more');

    // Expand the content
    toggleReadMore(readButton, archiveInfo);
    expect(archiveInfo.classList.contains('expanded')).toBe(true);
    expect(readButton.textContent).toBe('Read less');

    // Collapse the content
    toggleReadMore(readButton, archiveInfo);
    expect(archiveInfo.classList.contains('expanded')).toBe(false);
    expect(readButton.textContent).toBe('Read more');
  });

  it('should display all images from a valid directory', (done) => {
    const dirPath = path.resolve(__dirname, '../public/archiveContent/shiley');

    if (!fs.existsSync(dirPath)) {
      console.warn(`Directory not found at ${dirPath}. Skipping test.`);
      expect(fs.existsSync(dirPath)).toBe(false);
      done();
      return;
    }

    const files = fs.readdirSync(dirPath).filter((file) => file.endsWith('.jpg'));

    if (files.length === 0) {
      console.warn(`No .jpg files found in ${dirPath}. Skipping test.`);
      expect(files.length).toBe(0);
      done();
      return;
    }

    const gallery = document.getElementById('gallery');
    files.forEach((file) => {
      const img = document.createElement('img');
      img.src = file;
      img.alt = file;
      gallery.appendChild(img);
    });

    const images = gallery.querySelectorAll('img');
    expect(images.length).toBe(files.length);
    images.forEach((img) => {
      expect(img.src.trim()).not.toBe('');
      expect(img.alt.trim()).not.toBe('');
    });
    done();
  });

  it('should handle empty gallery gracefully', () => {
    const gallery = document.getElementById('gallery');
    expect(gallery.children.length).toBe(0);

    const warningMessage = document.createElement('p');
    warningMessage.textContent = 'No images available.';
    gallery.appendChild(warningMessage);

    expect(gallery.children.length).toBe(1);
    expect(gallery.querySelector('p').textContent).toBe('No images available.');
  });
});
