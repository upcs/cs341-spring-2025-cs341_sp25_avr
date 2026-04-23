/**
 * @jest-environment node
 */

const { invokeRoute } = require('./serverHelpers');

function buildGeoRouter() {
  jest.resetModules();

  const dbMock = {
    dbquery: jest.fn(),
  };

  jest.doMock('../routes/dbms_promise', () => dbMock);
  const router = require('../routes/geoTable');
  return { router, dbMock };
}

describe('initialApp geo routes', () => {
  test('returns mapped coordinates and handles database failures', async () => {
    const { router, dbMock } = buildGeoRouter();

    dbMock.dbquery
      .mockResolvedValueOnce([
        {
          buildingName: 'Shiley',
          latMin: 45.1,
          latMax: 45.2,
          longMin: -122.7,
          longMax: -122.6,
        },
      ])
      .mockRejectedValueOnce(new Error('db down'));

    expect(await invokeRoute(router, 'get', '/coordinates')).toMatchObject({
      status: 200,
      json: [
        {
          name: 'Shiley',
          latMin: 45.1,
          latMax: 45.2,
          longMin: -122.7,
          longMax: -122.6,
        },
      ],
    });

    expect(await invokeRoute(router, 'get', '/coordinates')).toMatchObject({
      status: 500,
      json: { error: 'Failed to retrieve coordinates' },
    });
  });

  test('validates and inserts new building coordinate rows', async () => {
    const { router, dbMock } = buildGeoRouter();

    dbMock.dbquery
      .mockResolvedValueOnce([])
      .mockRejectedValueOnce(new Error('insert failed'));

    expect(
      await invokeRoute(router, 'post', '/addBuilding', {
        body: { buildingName: 'Shiley' },
      })
    ).toMatchObject({
      status: 400,
      json: { error: 'buildingName, latMax, latMin, longMax, and longMin are required' },
    });

    expect(
      await invokeRoute(router, 'post', '/addBuilding', {
        body: { buildingName: 'Shiley', latMax: 'bad', latMin: 1, longMax: 2, longMin: 3 },
      })
    ).toMatchObject({
      status: 400,
      json: { error: 'Coordinates must be valid numbers' },
    });

    expect(
      await invokeRoute(router, 'post', '/addBuilding', {
        body: { buildingName: 'Shiley', latMax: 45.2, latMin: 45.1, longMax: -122.6, longMin: -122.7 },
      })
    ).toMatchObject({
      status: 200,
      json: { message: 'Building added successfully!' },
    });
    expect(dbMock.dbquery.mock.calls[0][0]).toContain('INSERT INTO Geo');

    expect(
      await invokeRoute(router, 'post', '/addBuilding', {
        body: { buildingName: 'Franz', latMax: 45.3, latMin: 45.2, longMax: -122.5, longMin: -122.6 },
      })
    ).toMatchObject({
      status: 500,
      json: { error: 'Failed to add building' },
    });
  });
});
