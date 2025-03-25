const { isUserNearBuilding } = require('../public/javascripts/geo.js');

describe('Boundary Check Functions', () => {
  const testBuilding = {
    latMin: 45.571,
    latMax: 45.573,
    longMin: -122.729,
    longMax: -122.727
  };

  test('should return true when user is inside bounds', () => {
    expect(isUserNearBuilding(45.572, -122.728, testBuilding)).toBe(true);
  });

  test('should return false when user is outside bounds', () => {
    // Test various out-of-bounds scenarios
    expect(isUserNearBuilding(45.570, -122.728, testBuilding)).toBe(false); // Below min lat
    expect(isUserNearBuilding(45.574, -122.728, testBuilding)).toBe(false); // Above max lat
    expect(isUserNearBuilding(45.572, -122.730, testBuilding)).toBe(false); // Below min long
    expect(isUserNearBuilding(45.572, -122.726, testBuilding)).toBe(false); // Above max long
  });

  test('should handle edge cases', () => {
    // Exactly on boundaries
    expect(isUserNearBuilding(45.571, -122.728, testBuilding)).toBe(true);
    expect(isUserNearBuilding(45.573, -122.728, testBuilding)).toBe(true);
    expect(isUserNearBuilding(45.572, -122.729, testBuilding)).toBe(true);
    expect(isUserNearBuilding(45.572, -122.727, testBuilding)).toBe(true);
  });
});