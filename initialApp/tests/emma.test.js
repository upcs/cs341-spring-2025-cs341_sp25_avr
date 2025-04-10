'use strict';

//jest.mock('../public/javascripts/geo.js');
const L = require('leaflet');

describe("Geo.js Additional Tests", () => {

    afterEach(() => {
        jest.clearAllMocks();
      });

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
            <button id="map-menu-button"></button>
            <button id="mapDropdown"></button>
            <button id="map-menu-button"></button>

            <button id="startButton">Start</button>
            <button id="nextButton">Start</button>
            <button id="backButton">Start</button>
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
            hideTapIconMessage,
        } = require("../public/javascripts/geo.js");
    
        global.alert = jest.fn(); // Mock alert
        error.mockRestore?.();  // Restore real function
    
    });


    //Make sure the start button switches to the main map
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
    
    //Simulate a click on the start button
    $('#startButton').click();
  
    //Wait for map to initialize before making assertions
    setTimeout(() => {
        //Test that fitBounds was called
        expect(mapMock.fitBounds).toHaveBeenCalled(); 
        //Ensure map is visible
        expect($("#map").is(":visible")).toBe(true); 
        done();
    }, 500);

    //Check if home screen is hidden and map screen is visible
    expect($('#phone-container').css('display')).toBe('none');
    expect($('#phone-container2').css('display')).toBe('flex');
  });



  test('error() should show alert for geolocation error', () => {

    //Ensure fresh modules
    jest.resetModules(); 
    jest.unmock("../public/javascripts/geo.js");

    //Mock alert
    global.alert = jest.fn(); 

    //Get real function
    const { error } = require("../public/javascripts/geo.js"); 

    //Restore real function 
    error.mockRestore?.();

    //Call function with an error object
    error({ code: 1 });  

    expect(global.alert).toHaveBeenCalledWith("Please allow geolocation access");

  });
  

  //Test that the debug works
  test("Clicking debug button should toggle popups", () => {
    const $ = require("jquery");
    
    const devButton = $('#debug-btn');
    const popups = $('.welcome-pop-up');
    
    popups.each((index, el) => {
        el.style.display = index === 0 ? 'none' : 'flex';
    });

    //Simulate button click
    devButton.trigger('click'); 
    
    popups.each((index, el) => {
        if (index !== 0) expect(el.style.display).toBe('flex');
    });

    devButton.trigger('click'); 

    popups.each((index, el) => {
        if (index !== 0) expect(el.style.display).toBe('flex');
    });
});


//Check if the user is near a building
test("isUserNearBuilding() should return true if user is inside building radius", () => {
   
    //Check to make sure it shows something
    const geo = require("../public/javascripts/geo.js");
    console.log(geo);

    //Importing again because it seems to not want to work
    const {
        isUserNearBuilding,
        getBuildingName,
        hideTapIconMessage
    } = require("../public/javascripts/geo.js");

    //Test to make sure properly imported. Should say: function
    console.log(typeof isUserNearBuilding); 
    console.log(typeof getBuildingName);    
    console.log(typeof hideTapIconMessage); 
   
   
    const mockCircle = {
        getLatLng: () => ({ lat: 45.5719, lng: -122.7290 }),
        getRadius: () => 30
    };
    
    expect(isUserNearBuilding(45.5719, -122.7290, mockCircle)).toBe(true);
    expect(isUserNearBuilding(45.5725, -122.7300, mockCircle)).toBe(false);
});


//Test getting the building name
test("getBuildingName() should return correct building", () => {
    
    const {
        isUserNearBuilding,
        getBuildingName,
        hideTapIconMessage
    } = require("../public/javascripts/geo.js");
    
    const mockCircles = {
        "shiley": { getLatLng: () => ({ lat: 45.571873, lng: -122.727941 }), getRadius: () => 30 },
        "merlo": { getLatLng: () => ({ lat: 45.574691, lng: -122.727368 }), getRadius: () => 60 }
    };

    expect(getBuildingName(45.571873, -122.727941, mockCircles)).toBe("shiley");
    expect(getBuildingName(45.574691, -122.727368, mockCircles)).toBe("merlo");
    expect(getBuildingName(45.580000, -122.740000, mockCircles)).toBe(null);
});


//Check if buttons are hidden
test("hideTapIconMessage() should modify message styles", () => {
    
    const {
        isUserNearBuilding,
        getBuildingName,
        hideTapIconMessage
    } = require("../public/javascripts/geo.js");

    //Replace the .default-message divs with mocks
    const mockMessages = [
        { style: { fontSize: "" } },
        { style: { display: "", color: "" } },
    ];
    
    document.querySelectorAll = jest.fn(() => mockMessages); 
    
    hideTapIconMessage();
    
    expect(mockMessages[1].style.display).toBe("none");
    expect(mockMessages[1].style.color).toBe("gray");
    expect(mockMessages[0].style.fontSize).toBe("24px");
});

});