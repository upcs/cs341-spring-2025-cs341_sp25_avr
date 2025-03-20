// archiveInfo.test.js
const fs = require('fs');

beforeEach((done) => {
  // Load the HTML file
  fs.readFile('sh_1948.html', 'utf8', (err, data) => {
    if (err) {
      done(err); // Pass error to Jest
    } else {
      const dom = new jsdom.JSDOM(data);
      global.document = dom.window.document;
      global.window = dom.window;
      done(); // Signal completion
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
