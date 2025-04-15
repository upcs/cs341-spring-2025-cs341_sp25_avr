/**
 * @jest-environment jsdom
 */
const $ = require('jquery');

describe("Popup tests:", () => {

    afterEach(() => {
        jest.clearAllMocks();
      });

      beforeEach(() => {
        document.body.innerHTML = `
          <div id="popupDisplay" class=""></div>
          <button id="startButton">Start</button>
          <button id="close-popup">Close</button>
        `;
        jest.resetModules(); // reset cached module state
      });

      test('openPopup should add "open-popup" class to popupDisplay', () => {
        const { openPopup } = require('../public/javascripts/popup.js');
        const popup = document.getElementById('popupDisplay');
      
        openPopup();
        expect(popup.classList.contains('open-popup')).toBe(true);
      });
      
      test('closePopup should remove "open-popup" class from popupDisplay', () => {
        const { closePopup } = require('../public/javascripts/popup.js');
        const popup = document.getElementById('popupDisplay');
        popup.classList.add('open-popup');
      
        closePopup();
        expect(popup.classList.contains('open-popup')).toBe(false);
      });
      
      test('clicking startButton triggers openPopup()', () => {
        document.getElementById('popupDisplay').classList.remove('open-popup');
        require('../public/javascripts/popup.js');
        document.getElementById('startButton').click();
      
        expect(document.getElementById('popupDisplay').classList.contains('open-popup')).toBe(true);
      });
      
      test('clicking close-popup button triggers closePopup()', () => {
        const popup = document.getElementById('popupDisplay');
        popup.classList.add('open-popup');
        require('../public/javascripts/popup.js');
      
        document.getElementById('close-popup').click();
        expect(popup.classList.contains('open-popup')).toBe(false);
      });
      

});