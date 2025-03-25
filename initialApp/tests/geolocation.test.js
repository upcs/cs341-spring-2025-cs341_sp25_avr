const { getUserCoords, checkAllBuildings } = require('../geo.js');

// Mock navigator.geolocation
global.navigator.geolocation = {
  getCurrentPosition: jest.fn()
};

// Mock dependencies
jest.mock('../geo.js', () => {
  const originalModule = jest.requireActual('../geo.js');
  return {
    ...originalModule,
    checkAllBuildings: jest.fn()
  };
});

describe('Geolocation Functions', () => {
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