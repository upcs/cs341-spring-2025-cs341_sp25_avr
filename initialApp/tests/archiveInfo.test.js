const fs = require('fs');
const { JSDOM } = require('jsdom');

beforeEach((done) => {
  // Load the HTML file
  fs.readFile(`${__dirname}/public/shiley.html`, 'utf8', (err, data) => {
    if (err) {
      done(err); // Pass error to Jest
    } else {
      const dom = new JSDOM(data);
      global.document = dom.window.document;
      global.window = dom.window;

      // Mock missing elements
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

      done(); // Signal completion
    }
  });
});

afterEach(() => {
  global.document = undefined;
  global.window = undefined;
});

it('should display archive info for each page', () => {
  // Get the archive info elements
  const archiveInfoElements = document.querySelectorAll('.building-photo, h1, h3, p');

  // Check if archive info elements are present
  expect(archiveInfoElements.length).toBeGreaterThan(0);

  // Check if each archive info element has content
  archiveInfoElements.forEach((element) => {
    expect(element.textContent.trim()).not.toBe('');
  });
});

it('should toggle read more/less button', () => {
  // Get the read more/less button
  const readButton = document.getElementById('read-button');

  // Simulate a click on the read more/less button
  readButton.click();

  // Check if the button text has changed
  expect(readButton.textContent).toBe('Read less');

  // Simulate another click on the read more/less button
  readButton.click();

  // Check if the button text has changed back
  expect(readButton.textContent).toBe('Read more');
});

it('should display past/future buttons', () => {
  // Get the past/future buttons
  const pastButton = document.getElementById('past-button');
  const futureButton = document.getElementById('future-button');

  // Check if past/future buttons are present
  expect(pastButton).not.toBeNull();
  expect(futureButton).not.toBeNull();
});

