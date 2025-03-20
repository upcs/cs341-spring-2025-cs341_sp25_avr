const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

describe('Archive Info Tests', () => {
  let dom;

  beforeEach((done) => {
    const dirPath = path.resolve(__dirname, '../public/archiveContent/shiley');

    // Check if the directory exists
    if (!fs.existsSync(dirPath)) {
      console.warn(`Directory not found at ${dirPath}. Skipping test.`);
      done();
      return;
    }

    // Read directory contents and filter for .jpg files
    const files = fs.readdirSync(dirPath).filter((file) => file.endsWith('.jpg'));

    if (files.length === 0) {
      console.warn(`No .jpg files found in ${dirPath}. Skipping test.`);
      done();
      return;
    }

    // Create a mock HTML structure with the images
    const mockHTML = `
      <!DOCTYPE html>
      <html>
      <body>
        <div id="gallery">
          ${files.map((file) => `<img src="${path.join(dirPath, file)}" alt="${file}">`).join('')}
        </div>
      </body>
      </html>
    `;

    dom = new JSDOM(mockHTML);
    global.document = dom.window.document;
    global.window = dom.window;
    done();
  });

  afterEach(() => {
    // Clean up the DOM
    global.document = undefined;
    global.window = undefined;
  });

  it('should display all images in the gallery', () => {
    const images = document.querySelectorAll('#gallery img');

    // Verify that images exist in the DOM
    expect(images.length).toBeGreaterThan(0);

    // Validate image attributes
    images.forEach((img) => {
      expect(img.src.trim()).not.toBe('');
      expect(img.alt.trim()).not.toBe('');
    });
  });

  it('should gracefully handle missing directory', (done) => {
    const dirPath = path.resolve(__dirname, '../public/archiveContent/nonexistent');

    if (!fs.existsSync(dirPath)) {
      console.warn(`Directory not found at ${dirPath}. Skipping test.`);
      expect(fs.existsSync(dirPath)).toBe(false); // Assert the directory does not exist
      done(); // Skip the test gracefully
      return;
    }

    // If the directory exists (unexpectedly), proceed with the test
    fs.readdir(dirPath, (err, files) => {
      expect(err).toBeNull(); // Ensure no error occurs
      expect(files.length).toBeGreaterThan(0); // Validate directory is not empty
      done();
    });
  });
});
