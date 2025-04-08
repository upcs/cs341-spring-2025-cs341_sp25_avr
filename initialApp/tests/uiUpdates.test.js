/**
 * @jest-environment jsdom
 */

const { hideLoader } = require('../public/javascripts/geo.js');

beforeEach(() => {
  document.body.innerHTML = `
    <div class="default-message"></div>
    <div class="default-message"></div>
    <div class="loader"></div>
    <div id="phone-container2"></div>
    <div id="phone-container3"></div>
  `;
  
  global.selectedBuilding = jest.fn();
});

describe('UI Update Functions', () => {
  test('should update display elements correctly', () => {
    hideLoader();
    
    const messages = document.querySelectorAll('.default-message');
    const loader = document.querySelector('.loader');
    
    expect(messages[0].style.display).toBe('flex');
    expect(messages[0].innerHTML).toBe('Near by buildings:');
    expect(messages[1].style.display).toBe('flex');
    expect(loader.style.display).toBe('none');
  });

  test('should attach click handler to popup', () => {
    hideLoader();
    
    const popup = document.querySelector('.welcome-pop-up');
    popup.click();
    
    expect(document.getElementById("phone-container2").style.display).toBe('none');
    expect(document.getElementById("phone-container3").style.display).toBe('flex');
  });
});