// archiveInfo.test.js
const fs = require('fs');

describe('Archive Info', () => {
    beforeEach(() => {
      // Load the HTML file
      fs.readFile('sh_1948.html', 'utf8', (err, data) => {
        if (err) {
          done(err);
        } else {
          html = data;
          const dom = new jsdom.JSDOM(html);
          global.document = dom.window.document;
          global.window = dom.window;
          done();
        }
      });
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
  });
