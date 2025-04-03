'use strict';

jest.mock('../public/javascripts/geo.js');
const L = require('leaflet');


beforeEach(() => {  

    const $ = require('jquery');

    //Mock fetch to prevent network calls
    global.navigator.geolocation = {
        watchPosition: (success, error) => {
            success({
                coords: { latitude: 45.5719, longitude: -122.7290, accuracy: 20 }
            });
        }
    };


    //Mock the map
    // global.L = {
    //     map: jest.fn(() => ({
    //         setView: jest.fn(),
    //         fitBounds: jest.fn(), //Mock fitBounds to avoid the error
    //         addLayer: jest.fn(),
    //     })),
    //     circle: jest.fn(() => ({
    //         getBounds: jest.fn(() => "mockBounds"), //Prevents layerPointToLatLng error
    //         addTo: jest.fn(),
    //     })),
    // };

    //Mock geolocation for Shiley
    global.navigator.geolocation = {
        watchPosition: jest.fn((success, error) => {
        // Simulate user location
        success({
            coords: {
            latitude: 45.57190748329964,
            longitude: -122.72902599935568,
            accuracy: 5
            }
        });
        }),
    };
  

    //Set up the required HTML structure for the test
    document.body.innerHTML = `
    <!DOCTYPE html>
    <html>
        <body>
        <div id="map"></div>
        <div id="details"></div>
        <div id="shiley"></div>
        <div class="loader"></div>
        <div class="default-message"></div>
        <div class="default-message"></div>
        <div class="popup welcome-pop-up" style="display: none;">Popup 1</div>
        <div class="popup welcome-pop-up" style="display: none;">Popup 2</div>
        <button id="debug-btn">Debug</button>
        <button id="startButton">Start</button>
        <button id="fullScreenButton">Fullscreen</button>
        
        <div id="phone-container"></div>
        <div id="phone-container2" style="display: none;"></div>
        <div id="phone-container3"></div>
        </body>
    </html>
    `;

    const {
        initMap,
        success, 
        toggleFullscreen, 
        updateButton, 
        updateDisplay, 
        isUserNearBuilding, 
        checkAllBuildings,
        getBuildingName,
    } = require("../public/javascripts/geo.js");

    global.alert = jest.fn(); // Mock alert
    error.mockRestore?.();  // Restore real function

});

afterEach(() => {
    jest.clearAllMocks();
  });

describe("Geo.js Additional Tests", () => {
  test('Clicking start button hides home screen and shows the map', () => {
    const $ = require('jquery');
    
    jest.spyOn(L, "map").mockImplementation(() => ({
        addLayer: jest.fn(),
        removeLayer: jest.fn(),
        setView: jest.fn(),
        fitBounds: jest.fn(),
        getNorthEast: jest.fn(),
        getSouthWest: jest.fn(),
    }));
    
    // Simulate a click on the start button
    $('#startButton').click();
  
    // Wait for map to initialize before making assertions
    setTimeout(() => {
        //Test that fitBounds was called
        expect(mapMock.fitBounds).toHaveBeenCalled(); 
        //Ensure map is visible
        expect($("#map").is(":visible")).toBe(true); 
        done();
    }, 500);

    // Check if home screen is hidden and map screen is visible
    expect($('#phone-container').css('display')).toBe('none');
    expect($('#phone-container2').css('display')).toBe('flex');
  });



  test('error() should show alert for geolocation error', () => {

    jest.resetModules(); // Ensure fresh modules
    jest.unmock("../public/javascripts/geo.js");

    global.alert = jest.fn(); // Mock alert

    const { error } = require("../public/javascripts/geo.js"); // Get real function

    error.mockRestore?.(); // Restore real function if it's mocked

    error({ code: 1 });  // Call function with an error object

    expect(global.alert).toHaveBeenCalledWith("Please allow geolocation access");

  });







  
  test("Clicking debug button should toggle popups", () => {
    const devButton = $('#debug-btn');
    const popups = $('.welcome-pop-up');
    
    popups.each((index, el) => {
        el.style.display = index === 0 ? 'none' : 'flex';
    });

    devButton.trigger('click'); // Simulate button click
    
    popups.each((index, el) => {
        if (index !== 0) expect(el.style.display).toBe('none');
    });

    devButton.trigger('click'); // Click again

    popups.each((index, el) => {
        if (index !== 0) expect(el.style.display).toBe('flex');
    });
});

test("isUserNearBuilding() should return true if user is inside building radius", () => {
    const mockCircle = {
        getLatLng: () => ({ lat: 45.5719, lng: -122.7290 }),
        getRadius: () => 30
    };
    
    expect(isUserNearBuilding(45.5719, -122.7290, mockCircle)).toBe(true);
    expect(isUserNearBuilding(45.5725, -122.7300, mockCircle)).toBe(false);
});

test("getBuildingName() should return correct building", () => {
    const mockCircles = {
        "shiley": { getLatLng: () => ({ lat: 45.571873, lng: -122.727941 }), getRadius: () => 30 },
        "merlo": { getLatLng: () => ({ lat: 45.574691, lng: -122.727368 }), getRadius: () => 60 }
    };

    expect(getBuildingName(45.571873, -122.727941, mockCircles)).toBe("shiley");
    expect(getBuildingName(45.574691, -122.727368, mockCircles)).toBe("merlo");
    expect(getBuildingName(45.580000, -122.740000, mockCircles)).toBe(null);
});

test("hideTapIconMessage() should modify message styles", () => {
    const messages = document.querySelectorAll(".default-message");
    messages[1] = { style: { display: "", color: "" } };
    messages[0] = { style: { fontSize: "" } };

    hideTapIconMessage();

    expect(messages[1].style.display).toBe("none");
    expect(messages[1].style.color).toBe("gray");
    expect(messages[0].style.fontSize).toBe("24px");
});


});