// Author: Chengen Li 
// Edited by Emma Jeppesen

require("fast-text-encoding");
const fs = require('fs');
const { JSDOM } = require('jsdom');
const { getUserCords } = require('../public/javascripts/geo');

global.navigator.geolocation = {
  getCurrentPosition: jest.fn((success) =>
    success({
      coords: {
        latitude: 45.523064, // Example latitude
        longitude: -122.676483, // Example longitude
      },
    })
  ),
  watchPosition: jest.fn(),
};

beforeAll(() => {
  // Mock navigator.geolocation
  global.navigator.geolocation = {
    getCurrentPosition: jest.fn(),
  };
});

beforeEach(() => {
  const html = fs.readFileSync(`${__dirname}/../public/geo.html`, 'utf8');
  const dom = new JSDOM(html);
  global.document = dom.window.document;
  global.window = dom.window;

  const detailsDiv = document.createElement('div');
  detailsDiv.id = 'details';
  document.body.appendChild(detailsDiv);
});

afterEach(() => {
  document.body.innerHTML = '';
  jest.clearAllMocks();
});

test('updates coordinates in HTML', () => {
  const mockPosition = {
    coords: {
      latitude: 45.5725,
      longitude: -122.7265,
    },
  };
  navigator.geolocation.getCurrentPosition.mockImplementationOnce((success) => success(mockPosition));

  getUserCords();

  const details = document.getElementById('details');
  expect(details.innerHTML).toContain('Latitude: 45.5725');
  expect(details.innerHTML).toContain('Longitude: -122.7265');
});

test('handles geolocation errors gracefully', () => {
  navigator.geolocation.getCurrentPosition.mockImplementationOnce((_, error) =>
    error({
      code: 1,
      message: 'Geolocation failed',
    })
  );

  getUserCords();

  const details = document.getElementById('details');
  expect(details.innerHTML).toContain('Error: Geolocation failed');
});

