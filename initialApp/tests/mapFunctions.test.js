
/**
 * @jest-environment jsdom
 */

const geo = require('../public/javascripts/geo.js');

// Mock Leaflet
global.L = {
  map: jest.fn(() => ({
    setView: jest.fn(),
    removeLayer: jest.fn(),
    fitBounds: jest.fn(),
  })),
  tileLayer: jest.fn(() => ({
    addTo: jest.fn(),
  })),
  marker: jest.fn(() => ({
    addTo: jest.fn().mockReturnThis(),
  })),
  circle: jest.fn(() => ({
    addTo: jest.fn(),
  })),
  Browser: { svg: true, vml: false },
};

describe('Map Functions', () => {
  beforeAll(() => {
    document.body.innerHTML = '<div id="map"></div>';
    global.navigator.geolocation = {
      watchPosition: jest.fn(),
    };
  });

  test('initMap should initialize map with correct settings', () => {
    geo.initMap();
    
    expect(L.map).toHaveBeenCalledWith(
      "map",
      expect.objectContaining({
        zoom: 13,
        zoomControl: false,
      })
    );
    
    expect(L.tileLayer).toHaveBeenCalled();
  });

  test('should export map and marker instances', () => {
    geo.initMap();
    expect(geo.map).toBeDefined();

    geo.success({ coords: { latitude: 45.572, longitude: -122.728, accuracy: 5 } });
    expect(geo.marker).toBeDefined();
  });
});
