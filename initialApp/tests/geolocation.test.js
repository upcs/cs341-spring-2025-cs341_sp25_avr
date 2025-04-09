const { getUserCoords, checkAllBuildings } = require('../public/javascripts/geo.js');

// Mock navigator.geolocation
global.navigator.geolocation = {
  getCurrentPosition: jest.fn()
};

//Mock dependencies
jest.mock('../public/javascripts/geo.js', () => {
  const originalModule = jest.requireActual('../public/javascripts/geo.js');
  return {
    ...originalModule,
    checkAllBuildings: jest.fn()
  };
});

describe('Geolocation Functions', () => {
 
  beforeEach(() => {

    document.body.innerHTML = `
    <!DOCTYPE html>
    <html>
        <body>
        <div id="map"></div>
        <div id="details"></div>
        <div id="shiley"></div>
        <div class="loader"></div>
        <div class="default-message"></div>
        <div class="default-message"></div>
        <div class="popup welcome-pop-up" style="display: none;">Popup 1</div>
        <div class="popup welcome-pop-up" style="display: none;">Popup 2</div>
        <button id="debug-btn">Debug</button>
        <button id="startButton">Start</button>
        <button id="nextButton">Start</button>
        <button id="backButton">Start</button>
        <button id="fullScreenButton">Fullscreen</button>
        
        <div id="phone-container"></div>
        <div id="phone-container2" style="display: none;"></div>
        <div id="phone-container3"></div>
        </body>
    </html>
    `
  });
 
  test('getUserCoords should update position on success', () => {
    
    const mockPosition = {
      coords: { latitude: 45.572, longitude: -122.728 }
    };
    navigator.geolocation.getCurrentPosition.mockImplementationOnce((success) => success(mockPosition));
    
    getUserCoords();
    
    expect(map.setCenter).toHaveBeenCalledWith({
      lat: 45.572,
      lng: -122.728
    });
    
    expect(checkAllBuildings).toHaveBeenCalledWith(45.572, -122.728);
  });

  test('should handle geolocation error', () => {
    navigator.geolocation.getCurrentPosition.mockImplementationOnce((success, error) => 
      error({ code: 1, message: 'Permission denied' })
    );
    
    getUserCoords();
    expect(console.error).toHaveBeenCalled();
  });
});