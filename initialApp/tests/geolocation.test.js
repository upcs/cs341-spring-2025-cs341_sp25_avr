const { initMap, success, error } = require('../public/javascripts/geo.js');

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
 
  test('initMap wires geolocation watchPosition', () => {
    global.L = {
      map: jest.fn().mockReturnValue({
        setView: jest.fn(),
        removeLayer: jest.fn(),
        fitBounds: jest.fn(),
      }),
      tileLayer: jest.fn().mockReturnValue({ addTo: jest.fn() }),
      marker: jest.fn().mockReturnValue({ addTo: jest.fn() }),
      circle: jest.fn().mockReturnValue({ addTo: jest.fn() }),
      Browser: { svg: true, vml: false },
    };

    global.navigator.geolocation = {
      watchPosition: jest.fn(),
    };

    initMap();
    expect(global.navigator.geolocation.watchPosition).toHaveBeenCalled();
  });

  test('should handle geolocation error', () => {
    global.alert = jest.fn();
    const alertSpy = jest.spyOn(global, "alert").mockImplementation(() => {});
    error({ code: 1, message: "Permission denied" });
    expect(alertSpy).toHaveBeenCalled();
    alertSpy.mockRestore();
  });
});
