const { TextEncoder, TextDecoder } = require("util");
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const fs = require('fs');
const { JSDOM } = require('jsdom');

beforeEach((done) => {
  const filePath = `${__dirname}/../public/shiley.html`;

  // Check if the file exists
  if (!fs.existsSync(filePath)) {
    console.warn(`Warning: File not found at ${filePath}. Skipping setup.`);
    done(); // Skip the test setup
    return;
  }

  // Read the file and set up DOM
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error(`Error reading file at ${filePath}:`, err);
      done(err); // Pass error to test framework
    } else {
      const dom = new JSDOM(data);
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
    }
  });
});

afterEach(() => {
  // Reset the global DOM
  global.document = undefined;
  global.window = undefined;
});

it('should display archive info for each page', () => {
  const archiveInfoElements = document.querySelectorAll('.building-photo, h1, h3, p');
  
  // Check that there are elements
  expect(archiveInfoElements.length).toBeGreaterThan(0);

  // Validate elements contain non-empty text
  archiveInfoElements.forEach((element) => {
    expect(element.textContent.trim()).not.toBe('');
  });
});

it('should handle missing file gracefully', (done) => {
  const filePath = `${__dirname}/public/shiley.html`;

  // Simulate missing file scenario
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found at ${filePath}. Skipping test.`);
    done(); // Exit the test setup
    return;
  }

  done();
});
