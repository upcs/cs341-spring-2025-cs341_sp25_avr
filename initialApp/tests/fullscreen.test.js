/**
 * @jest-environment jsdom
 */

const { toggleFullscreen, updateButton } = require('../geo.js');

beforeEach(() => {
  document.body.innerHTML = '<div id="fullScreenButton"></div>';
  document.fullscreenElement = null;
});

describe('Fullscreen Functions', () => {
  test('toggleFullscreen should enter fullscreen', () => {
    document.documentElement.requestFullscreen = jest.fn();
    toggleFullscreen();
    
    expect(document.documentElement.requestFullscreen).toHaveBeenCalled();
  });

  test('toggleFullscreen should exit fullscreen', () => {
    document.fullscreenElement = true;
    document.exitFullscreen = jest.fn();
    toggleFullscreen();
    
    expect(document.exitFullscreen).toHaveBeenCalled();
  });

  test('updateButton should change text based on state', () => {
    const button = document.getElementById('fullScreenButton');
    
    // Test fullscreen state
    document.fullscreenElement = true;
    updateButton();
    expect(button.textContent).toBe('Minimize');
    
    // Test non-fullscreen state
    document.fullscreenElement = null;
    updateButton();
    expect(button.textContent).toBe('Fullscreen');
  });
});