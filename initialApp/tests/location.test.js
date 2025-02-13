// Author: Chengen Li 


// Mock the gelocation API
beforeAll(() => {
	global.navigator.geolocation = {
		getCurrentPosition: jest.fn();
	};
});

const fs = require('fs');
const html = fs.readFileSync('geo.html', 'utf8');
document.body.innerHTML = html;

require('geo.js');

test('updates coordinates in HTML', () => {
	const mockPostion = {
		coords: {
			lat: 45.5725,
			long: -122.7265
		}
	};
	// Mock the geolocation API call	
	navigator.geolocation.getCurrentPosition.mockImplementationOnce((success) => success(mockPosition));

	// Call the original function
	getUserCords();
	
	// Check if HTML elements are updated
	const details = document.getElementById('details');
	expect(details.innerHTML).toContain('Latitude: 45.5725');
	expect(details.innerHTML).toContain('Longitude: -122.7265');

});
