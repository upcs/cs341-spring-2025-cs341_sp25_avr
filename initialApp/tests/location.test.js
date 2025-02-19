// Author: Chengen Li 
// Edited by Emma Jeppesen


// Fix for `TextEncoder` not being defined
require("fast-text-encoding");

const { JSDOM } = require("jsdom");


// Mock a basic HTML structure for the test
const dom = new JSDOM(`
	<div id="messages">
	  <p class="message">Message 1</p>
	  <p class="message">Message 2</p>
	</div>
  `);

  //mock navigator.geolocation.getCurrentPosition
  global.navigator.geolocation = {
	getCurrentPosition: jest.fn((success) =>
	  success({
		coords: {
		  latitude: 45.523064,  // Example latitude
		  longitude: -122.676483,  // Example longitude
		},
	  })
	),
	watchPosition: jest.fn(),
  };
  
  // Assign the window and document objects globally
  global.document = dom.window.document;
  global.window = dom.window;
  
  // Ensure message is properly selected
  global.message = document.querySelectorAll(".message");

beforeAll(() => {
	// Mock the geolocation API if needed
	global.navigator.geolocation = {
	  getCurrentPosition: jest.fn(),
	};
  });


// Mock the gelocation API
beforeAll(() => {
	global.navigator.geolocation = {
		getCurrentPosition: jest.fn(),
	};
});



const fs = require('fs');
const html = fs.readFileSync('public/geo.html', 'utf8');
document.body.innerHTML = html;

require('../public/javascripts/geo');

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
