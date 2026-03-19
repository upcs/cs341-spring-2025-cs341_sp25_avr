
const { buildings } = require('../public/javascripts/geo.js');

describe('Building Data Functions', () => {
  test('should include expected building names', () => {
    const names = buildings.map((b) => b.name);
    expect(names).toContain('shiley');
    expect(names).toContain('waldschmidt');
    expect(buildings.length).toBeGreaterThan(10);
  });
});
