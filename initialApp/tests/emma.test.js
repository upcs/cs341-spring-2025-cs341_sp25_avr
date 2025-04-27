'use strict';

//jest.mock('../public/javascripts/geo.js');
const L = require('leaflet');
let geoModule;
let mockMap;
let mockCircle;
let mockMarker;

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
        <div id="details"></div>
        <div id="buildingName">bob</div>
        <div id="shiley"></div>

        <div class="popup welcome-pop-up" style="display: none;">Popup 1</div>
        <div class="popup welcome-pop-up" style="display: none;">Popup 2</div>
        <button id="debug-btn">Debug</button>
       
        <div id="map" style="width: 400px; height: 400px;"></div>
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

        <div class="message" style="display: none;"></div>
        <div class="message" style="display: none;"></div>
        <div class="loader"></div>
        <div class="default-message" style='none'></div>
        <div class="default-message" style='none'></div>
        </body>
    </html>
    `;

    const {
        initMap,
        success, 
        isUserNearBuilding, 
        getBuildingName,
        hideTapIconMessage,
    } = require("../public/javascripts/geo.js");

    //Mock Leaflet methods
    mockCircle = {
        getLatLng: jest.fn(() => ({ lat: 45.5718, lng: -122.7279 })),
        getRadius: jest.fn(() => 45),
        addTo: jest.fn(() => mockCircle),
        buildingName: "shiley"
    };

    mockMarker = {
        addTo: jest.fn(() => mockMarker)
    };

    mockMap = {
        removeLayer: jest.fn(),
        setView: jest.fn(),
        fitBounds: jest.fn(() => "fitBounds-called"),
        addLayer: jest.fn(),
    };

    global.alert = jest.fn(); // Mock alert
    error.mockRestore?.();  // Restore real function

});

describe("Geo.js Additional Tests", () => {

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

    test("error() handles unknown error codes", () => {
        const { error } = require("../public/javascripts/geo.js");
        global.alert = jest.fn();
    
        error({ code: 999 }); 
        expect(global.alert).toHaveBeenCalledWith("Cannot get current location");
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

    test("initMap sets up the map", () => {
        jest.spyOn(L, 'map').mockImplementation(() => mapMock);
        
        const { initMap } = require("../public/javascripts/geo.js");
    
        // Set up fake map container
    
        // Mock Leaflet
        const setView = jest.fn();
        const mapMock = {
        setView,
        addLayer: jest.fn(),
        removeLayer: jest.fn(),
        fitBounds: jest.fn(),
        getBounds: () => ({
            getNorthEast: () => ({ lat: 45.6, lng: -122.7 }),
            getSouthWest: () => ({ lat: 45.5, lng: -122.8 }),
        }),
        };
        
    
        jest.spyOn(L, "map").mockReturnValue(mapMock);
        jest.spyOn(L, "tileLayer").mockReturnValue({ addTo: jest.fn() });
    
        initMap();
    
        expect(setView).toHaveBeenCalled();
    });

    test("should skip calling fitBounds in test environment", () => {
        const {success} = require('../public/javascripts/geo.js')
        const fitBoundsMock = jest.fn();
        map.fitBounds = fitBoundsMock;
    
        // Simulate a valid user location update in a test environment
        process.env.NODE_ENV = "test";
        success({ coords: { latitude: 45.571, longitude: -122.729, accuracy: 50 } });
    
        expect(fitBoundsMock).not.toHaveBeenCalled();
    });

    test('hideLoader displays message elements and hides loader', () => {
        const {hideLoader} = require ('../public/javascripts/geo.js');
        
        document.body.innerHTML = `
        <div class="message" style="display: none;"></div>
        <div class="message" style="display: none;"></div>
        <div id="loader" style="display: block;"></div>
        `;
    
        global.message = document.querySelectorAll('.message');
        global.loader = document.getElementById('loader');

        const messages = document.getElementsByClassName('message');
        console.log("Display is", messages[0].style.display);
        
        hideLoader();

        console.log("Display is", messages[0].style.display);
        console.log("Display 1 is", messages[1].style.display);
    
        expect(message[0].style.display).toBe('flex');
        expect(message[0].innerHTML).toBe('Nearby buildings:');
        expect(message[1].style.display).toBe('flex');
        expect(loader.style.display).toBe('none');
    });

    test("Zoomed call fitBounds once when user location is updated", () => {
        const { success } = require('../public/javascripts/geo.js');
        jest.spyOn(L, 'map').mockImplementation(() => mockMap);

        
        const fitBoundsMock = jest.fn();
        L.fitBounds = fitBoundsMock; // Mock the map.fitBounds method

        // Trigger the success function with user position
        success({ coords: { latitude: 45.571, longitude: -122.729, accuracy: 50 } });

        // Expect fitBounds to be called once
        expect(fitBoundsMock).toHaveBeenCalledTimes(1);
    });
    


    test("User marker and accuracy circle update on location success", () => {
        const { success } = require("../public/javascripts/geo.js");

        // Mock L.marker and L.circle methods
        const setLatLngMock = jest.fn();
        const setRadiusMock = jest.fn();
        const mockMarker = { setLatLng: setLatLngMock, addTo: jest.fn() };
        const mockCircle = { setLatLng: setLatLngMock, setRadius: setRadiusMock, addTo: jest.fn() };

        // Mock L functions to return our mocked objects
        L.marker = jest.fn(() => mockMarker);
        L.circle = jest.fn(() => mockCircle);

        // Trigger success with user position
        success({ coords: { latitude: 45.571, longitude: -122.729, accuracy: 10 } });

        // Test if the functions were called with the correct arguments
        expect(mockMarker.setLatLng).toHaveBeenCalledWith([45.571, -122.729]);
        expect(mockCircle.setLatLng).toHaveBeenCalledWith([45.571, -122.729]);
        expect(mockCircle.setRadius).toHaveBeenCalledWith(10);
        expect(mockMarker.addTo).toHaveBeenCalledWith(mockMap);
        expect(mockCircle.addTo).toHaveBeenCalledWith(mockMap);
    });


    test("initMap sets up the map", () => {
        const { initMap } = require("../public/javascripts/geo.js");
    
        const mockSetView = jest.fn();
        const mockFitBounds = jest.fn();
        const mockAddLayer = jest.fn();
    
        jest.spyOn(L, "map").mockImplementation(() => ({
        setView: mockSetView,
        fitBounds: mockFitBounds,
        addLayer: mockAddLayer,
        }));
    
        initMap();
    
        expect(mockSetView).toHaveBeenCalled();
        expect(mockAddLayer).toHaveBeenCalled();
    });
    

    test("hideLoader displays message elements and hides loader", () => {
        const { hideLoader } = require("../public/javascripts/geo.js");
    
        const messageDivs = document.querySelectorAll('.message');
        const loader = document.getElementById('loader');
    
        messageDivs[0].style.display = '';
        messageDivs[1].style.display = '';
        messageDivs[0].innerHTML = '';
        messageDivs[1].innerHTML = '';
        loader.style.display = 'block';
    
        hideLoader();
    
        expect(messageDivs[0].style.display).toBe('flex');
        expect(messageDivs[0].innerHTML).toBe('Nearby buildings:');
        expect(messageDivs[1].style.display).toBe('flex');
        expect(loader.style.display).toBe('none');
    });
    
    test("Zoomed call fitBounds once when user location is updated", () => {
        const { success } = require("../public/javascripts/geo.js");
    
        const fitBoundsMock = jest.fn();
        const setViewMock = jest.fn();
    
        global.map = {
        fitBounds: fitBoundsMock,
        setView: setViewMock,
        removeLayer: jest.fn(),
        addLayer: jest.fn(),
        };
    
        global.L = {
        marker: jest.fn(() => ({
            addTo: jest.fn(),
        })),
        circle: jest.fn(() => ({
            addTo: jest.fn(),
        })),
        };
    
        success({
        coords: {
            latitude: 45.5719,
            longitude: -122.729,
            accuracy: 10,
        },
        });
    
        expect(fitBoundsMock).toHaveBeenCalledTimes(1);
    });
    
    test("User marker and accuracy circle update on location success", () => {
        const { success } = require("../public/javascripts/geo.js");
    
        global.map = {
        fitBounds: jest.fn(),
        setView: jest.fn(),
        removeLayer: jest.fn(),
        addLayer: jest.fn(),
        };
    
        const mockAddTo = jest.fn();
        const mockCircle = {
        addTo: mockAddTo,
        buildingName: "",
        };
        const mockMarker = {
        addTo: mockAddTo,
        };
    
        global.L = {
        marker: jest.fn(() => mockMarker),
        circle: jest.fn(() => mockCircle),
        };
    
        // Define buildings manually here so circle.buildingName doesn't explode
        const buildingData = [
        { name: 'shiley', lat: 45.5719, lng: -122.729 },
        { name: 'library', lat: 45.572, lng: -122.728 },
        ];
    
        global.buildings = buildingData;
    
        success({
        coords: {
            latitude: 45.5719,
            longitude: -122.729,
            accuracy: 10,
        },
        });
    
        expect(L.marker).toHaveBeenCalled();
        expect(L.circle).toHaveBeenCalled();
    });
    
});