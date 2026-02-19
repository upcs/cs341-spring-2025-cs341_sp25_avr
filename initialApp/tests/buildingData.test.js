
const { buildingNames, getBuildingBounds, formatBuildingName } = require('../public/javascripts/geo.js');
const $ = require('jquery');

jest.mock('jquery');

describe('Building Data Functions', () => {
  describe('buildingNames array', () => {
    test('should contain correct building names', () => {
      expect(buildingNames).toContain('shiley');
      expect(buildingNames).toContain('waldschmidt');
      expect(buildingNames.length).toBe(20);
    });
  });

  describe('getBuildingBounds', () => {
    beforeEach(() => {
      $.post.mockImplementation(() => Promise.resolve([{
        latMin: 45.571, latMax: 45.573,
        longMin: -122.729, longMax: -122.727
      }]));
    });

    test('should make POST request with building name', async () => {
      const mockCallback = jest.fn();
      await getBuildingBounds('shiley', mockCallback);
      expect($.post).toHaveBeenCalledWith("/geoTable", { buildingName: 'shiley' });
    });
  });

  describe('formatBuildingName', () => {
    test('should format known building names', () => {
      expect(formatBuildingName('shiley')).toBe('Shiley School of Engineering');
      expect(formatBuildingName('lund')).toBe('Lund Family Hall');
    });

    test('should return original for unknown buildings', () => {
      expect(formatBuildingName('unknown')).toBe('unknown');
    });
  });
});
