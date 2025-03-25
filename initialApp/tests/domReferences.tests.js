/**
 * @jest-environment jsdom
 */

const { message, loader, popups, devButton } = require('../geo.js');

beforeEach(() => {
  document.body.innerHTML = `
    <div class="default-message"></div>
    <div class="default-message"></div>
    <div class="loader"></div>
    <div class="welcome-pop-up"></div>
    <div id="debug-btn"></div>
  `;
});

describe('DOM Element References', () => {
  test('should correctly reference message elements', () => {
    expect(message.length).toBe(2);
    expect(message[0]).toBeInstanceOf(HTMLElement);
    expect(message[1]).toBeInstanceOf(HTMLElement);
  });

  test('should reference loader element', () => {
    expect(loader).toBeInstanceOf(HTMLElement);
  });

  test('should reference popup elements', () => {
    expect(popups.length).toBeGreaterThan(0);
    expect(popups[0]).toBeInstanceOf(HTMLElement);
  });

  test('should reference dev button', () => {
    expect(devButton).toBeInstanceOf(HTMLElement);
  });
});