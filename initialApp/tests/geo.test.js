const fs = require('fs');
const { JSDOM } = require('jsdom');

describe('Geolocation Tests', () => {
    let document;
    let mockPosition;

    beforeAll(() => {
        global.navigator.geolocation = {
            getCurrentPosition: jest.fn()
        };
    });

    beforeEach(() => {
        const html = fs.readFileSync('public/geo.html', 'utf8');
        const dom = new JSDOM(html);
        document = dom.window.document;
        global.document = document;
        global.window = dom.window;

        // Create the "details" div if not in HTML
        const detailsDiv = document.createElement('div');
        detailsDiv.id = 'details';
        document.body.appendChild(detailsDiv);

        // Mock geolocation data
        mockPosition = {
            coords: {
                latitude: 45.5725,
                longitude: -122.7265
            }
        };
    });

    it('updates coordinates in HTML', () => {
        navigator.geolocation.getCurrentPosition.mockImplementationOnce((success) => success(mockPosition));

        getUserCoords();

        const details = document.getElementById('details');
        expect(details.innerHTML).toContain('Latitude: 45.5725');
        expect(details.innerHTML).toContain('Longitude: -122.7265');
    });
});
