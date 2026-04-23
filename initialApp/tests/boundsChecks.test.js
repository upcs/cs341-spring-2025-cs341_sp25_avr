
const { isUserNearBuilding } = require('../public/javascripts/geo.js');

describe('Boundary Check Functions', () => {
  const circleMock = {
    getLatLng: jest.fn().mockReturnValue({ lat: 45.572, lng: -122.728 }),
    getRadius: jest.fn().mockReturnValue(50),
  };

  beforeEach(() => {
    global.L = {
      latLng: jest.fn(() => ({
        distanceTo: jest.fn(),
      })),
    };
  });

  test('should return true when user is inside radius', () => {
    global.L.latLng = jest.fn(() => ({ distanceTo: jest.fn().mockReturnValue(40) }));
    expect(isUserNearBuilding(45.572, -122.728, circleMock)).toBe(true);
  });

  test('should return false when user is outside radius', () => {
    global.L.latLng = jest.fn(() => ({ distanceTo: jest.fn().mockReturnValue(60) }));
    expect(isUserNearBuilding(45.570, -122.728, circleMock)).toBe(false);
  });

  test('should handle edge cases at radius boundary', () => {
    global.L.latLng = jest.fn(() => ({ distanceTo: jest.fn().mockReturnValue(50) }));
    expect(isUserNearBuilding(45.571, -122.728, circleMock)).toBe(true);
  });
});
