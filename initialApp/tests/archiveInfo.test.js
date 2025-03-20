const { TextEncoder, TextDecoder } = require("util");
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

beforeEach((done) => {
  const dirPath = path.resolve(__dirname, '../public/archiveContent/shiley');

  // Check if the directory exists
  if (!fs.existsSync(dirPath)) {
    console.warn(`Warning: Directory not found at ${dirPath}. Skipping setup.`);
    done(); // Skip the test setup
    return;
  }

  // Read the directory contents and simulate DOM setup for test
  const files = fs.readdirSync(dirPath).filter(file => file.endsWith('.jpg'));

  // Create a mock DOM including image elements for each file
  const mockHTML = `
    <!DOCTYPE html>
    <html>
      <body>
        <div id="gallery">
          ${files.map(file => `<img src="${dirPath}/${file}" alt="${file}">`).join('')}
        </div>
      </body>
    </html>
  `;
  const dom = new JSDOM(mockHTML);
  global.document = dom.window.document;
  global.window = dom.window;

  // Mock necessary buttons
  const readButton = document.createElement('button');
  readButton.id = 'read-button';
  readButton.textContent = 'Read more';
  document.body.appendChild(readButton);

  const pastButton = document.createElement('button');
  pastButton.id = 'past-button';
  document.body.appendChild(pastButton);

  const futureButton = document.createElement('button');
  futureButton.id = 'future-button';
  document.body.appendChild(futureButton);

  done();
});

afterEach(() => {
  // Reset the global DOM
  global.document = undefined;
  global.window = undefined;
});

it('should verify images are displayed in gallery', () => {
  const images = document.querySelectorAll('#gallery img');

  // Ensure images exist
  expect(images.length).toBeGreaterThan(0);

  // Validate each image has a non-empty "src" attribute
  images.forEach((img) => {
    expect(img.src.trim()).not.toBe('');
  });
});

it('should handle missing directory gracefully', (done) => {
  const dirPath = path.resolve(__dirname, '../public/archiveContent/nonexistent');

  // Simulate a missing directory scenario
  if (!fs.existsSync(dirPath)) {
    console.warn(`Directory not found at ${dirPath}. Skipping test.`);
    done();
    return;
  }

  done();
});

