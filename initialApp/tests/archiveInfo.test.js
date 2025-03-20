const fs = require('fs');
const { JSDOM } = require('jsdom');

global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;

beforeEach((done) => {
  fs.readFile(`${__dirname}/public/shiley.html`, 'utf8', (err, data) => {
    if (err) {
      done(err);
    } else {
      const dom = new JSDOM(data);
      global.document = dom.window.document;
      global.window = dom.window;

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
  global.document = undefined;
  global.window = undefined;
});

it('should display archive info for each page', () => {
  const archiveInfoElements = document.querySelectorAll('.building-photo, h1, h3, p');
  expect(archiveInfoElements.length).toBeGreaterThan(0);

  archiveInfoElements.forEach((element) => {
    expect(element.textContent.trim()).not.toBe('');
  });
});


