const fs = require('fs');
const { JSDOM } = require('jsdom');
const { getUserCoords } = require('../public/javascripts/geo');

describe('Geolocation Tests', () => {
  let document;

  beforeAll(() => {
    global.navigator.geolocation = {
      getCurrentPosition: jest.fn(),
    };
  });

  beforeEach(() => {
    const html = fs.readFileSync(`${__dirname}/../public/geo.html`, 'utf8');
    const dom = new JSDOM(html);
    document = dom.window.document;
    global.document = document;
    global.window = dom.window;

    const detailsDiv = document.createElement('div');
    detailsDiv.id = 'details';
    document.body.appendChild(detailsDiv);

    navigator.geolocation.getCurrentPosition.mockImplementation((success) =>
      success({
        coords: {
          latitude: 45.5725,
          longitude: -122.7265,
        },
      })
    );
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  it('updates coordinates in HTML', () => {
    getUserCoords();

    const details = document.getElementById('details');
    expect(details.innerHTML).toContain('Latitude: 45.5725');
    expect(details.innerHTML).toContain('Longitude: -122.7265');
  });
});

