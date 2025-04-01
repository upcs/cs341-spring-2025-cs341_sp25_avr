/**
 * @jest-environment jsdom
 */

const { initMap, map, marker } = require('../public/javascripts/geo.js');

// Mock Google Maps
// jest.mock('../__mocks__/google.js');

describe('Map Functions', () => {
  beforeAll(() => {
    document.body.innerHTML = '<div id="map"></div>';
  });

  test('initMap should initialize map with correct settings', () => {
    initMap();
    
    expect(google.maps.Map).toHaveBeenCalledWith(
      document.getElementById('map'),
      {
        center: { lat: 45.572, lng: -122.727 },
        zoom: 18,
        disableDefaultUI: true,
        zoomControl: false,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false
      }
    );
    
    expect(google.maps.Marker).toHaveBeenCalled();
  });

  test('should export map and marker instances', () => {
    initMap();
    expect(map).toBeDefined();
    expect(marker).toBeDefined();
  });
});