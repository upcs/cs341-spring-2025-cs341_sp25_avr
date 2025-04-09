
/**
 * @jest-environment jsdom
 */

beforeEach(() => {
  document.body.innerHTML = '<div id="fullScreenButton">Minimize</div>';
  document.fullscreenElement = null;
  jest.resetModules();

});

describe('Fullscreen Functions', () => {
  
  test('toggleFullscreen should enter fullscreen', () => {
    
    const { toggleFullscreen } = require('../public/javascripts/fullscreen.js');


    document.documentElement.requestFullscreen = jest.fn();
    toggleFullscreen();
    
    expect(document.documentElement.requestFullscreen).toHaveBeenCalled();
  });

  test('toggleFullscreen should exit fullscreen', () => {
    
    const { toggleFullscreen } = require('../public/javascripts/fullscreen.js');
    
    document.fullscreenElement = true;
    document.exitFullscreen = jest.fn();
    toggleFullscreen();
    
    expect(document.exitFullscreen).toHaveBeenCalled();
  });

  test('updateButton should change text based on state', () => {
    
    const { updateButton } = require('../public/javascripts/fullscreen.js');
    
    document.documentElement.requestFullscreen = jest.fn();
    document.exitFullscreen = jest.fn();

    const button = document.getElementById('fullScreenButton');
    
    //Test fullscreen state
    document.fullscreenElement = true;
    document.dispatchEvent(new Event('fullscreenchange'));
    expect(button.textContent).toBe('Minimize');
    
    //Test non-fullscreen state
    document.fullscreenElement = null;
    document.dispatchEvent(new Event('fullscreenchange'));
    expect(button.textContent).toBe('Fullscreen');
  });

  test('goFullscreen is called on DOMContentLoaded if sessionStorage is set', () => {
    sessionStorage.setItem("fullscreen", "true");
    document.documentElement.requestFullscreen = jest.fn();
  
    //Reload the module after setting up DOM and sessionStorage
    require('../public/javascripts/fullscreen.js');
  
    document.dispatchEvent(new Event('DOMContentLoaded'));
  
    expect(document.documentElement.requestFullscreen).toHaveBeenCalled();
  });

  test('clicking the button calls toggleFullscreen', () => {
    //Setup DOM
    document.documentElement.requestFullscreen = jest.fn();
  
    //Reset the cache so the module rebinds everything
    jest.resetModules(); 
    require('../public/javascripts/fullscreen.js');
  
    //Simulate a click
    const button = document.getElementById('fullScreenButton');
    button.click();
  
    expect(document.documentElement.requestFullscreen).toHaveBeenCalled();
  });

});

 //Check all the fullscreen methods for different browsers
describe('Check all the fullscreen methods for different browsers/vendors', () => {
  const entryMethods = [
    { name: 'requestFullscreen', prop: 'requestFullscreen' },
    { name: 'webkitRequestFullscreen', prop: 'webkitRequestFullscreen' },
    { name: 'mozRequestFullScreen', prop: 'mozRequestFullScreen' },
    { name: 'msRequestFullscreen', prop: 'msRequestFullscreen' }
  ];

  test.each(entryMethods)(
    'calls %s when entering fullscreen',
    ({ name, prop }) => {
      // Set up the DOM
      document.body.innerHTML = '<div id="fullScreenButton">Fullscreen</div>';
      document.fullscreenElement = null; // Not in fullscreen

      // Remove all possible entry methods
      delete document.documentElement.requestFullscreen;
      delete document.documentElement.webkitRequestFullscreen;
      delete document.documentElement.mozRequestFullScreen;
      delete document.documentElement.msRequestFullscreen;

      // Mock only the one we’re testing
      document.documentElement[prop] = jest.fn();

      // Reload the module to use the current DOM
      jest.resetModules();
      const { toggleFullscreen } = require('../public/javascripts/fullscreen.js');

      toggleFullscreen();

      expect(document.documentElement[prop]).toHaveBeenCalled();
    }
  );
});

 //Check all the exit fullscreen methods for different browsers
describe('Check all the exit fullscreen methods for different browsers/vendors', () => {
  const exitMethods = [
    { name: 'exitFullscreen', prop: 'exitFullscreen' },
    { name: 'webkitExitFullscreen', prop: 'webkitExitFullscreen' },
    { name: 'mozCancelFullScreen', prop: 'mozCancelFullScreen' },
    { name: 'msExitFullscreen', prop: 'msExitFullscreen' }
  ];

  test.each(exitMethods)(
    'calls %s when exiting fullscreen',
    ({ name, prop }) => {
      // Simulate being in fullscreen mode
      document.fullscreenElement = true;

      // Clear out other fullscreen exit methods so we fall through to the one we want
      ['exitFullscreen', 'webkitExitFullscreen', 'mozCancelFullScreen', 'msExitFullscreen']
        .forEach(p => { delete document[p]; });

      // Set our target method as a mock function
      document[prop] = jest.fn();

      // Reset modules to make sure event listeners re-attach to this DOM
      jest.resetModules();
      const { toggleFullscreen } = require('../public/javascripts/fullscreen.js');

      toggleFullscreen();

      expect(document[prop]).toHaveBeenCalled();
    }
  );
});
