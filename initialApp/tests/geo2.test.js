// Enable Jest fetch mock
const fetchMock = require("jest-fetch-mock");
fetchMock.enableMocks();

// Import the functions you want to test
const { success, toggleFullscreen, updateButton, updateDisplay, isUserNearBuilding, checkAllBuildings } = require("../public/javascripts/geo.js");
beforeEach(() => {
    fetch.resetMocks(); // Reset fetch mock before each test
});

document.body.innerHTML = `
    <div class="message"></div>
    <div class="message"></div>
    <div id="loader"></div>
    <button id="fullscreen-btn"></button>
`;

const message = document.querySelectorAll(".message");
const loader = document.getElementById("loader");
const btn = document.getElementById("fullscreen-btn");


describe("geo.js functionality", () => {
    
    beforeEach(() => {
        document.body.innerHTML = `
            <div class="message"></div>
            <div class="message"></div>
            <div id="loader"></div>
            <button id="fullscreen-btn"></button>
        `;
    
        // Re-query the elements inside the test
        global.message = document.querySelectorAll(".message");
        global.loader = document.getElementById("loader");
        global.btn = document.getElementById("fullscreen-btn");
    });
    
    // test("Update display should modify popups correctly", () => {
    //     expect(() => updateDisplay({})).not.toThrow();
    // });
    
    // test("Toggles fullscreen mode", () => {
    //     expect(() => toggleFullscreen()).not.toThrow();
    // });
    
    // test("Update button text based on fullscreen mode", () => {
    //     expect(() => updateButton()).not.toThrow();
    // });
    
    test("Mocks fetch for building coordinates", async () => {
        fetch.mockResponseOnce(JSON.stringify([
            { name: "Shiley", latMin: 45.572, latMax: 45.573, longMin: -122.725, longMax: -122.724 }
        ]));

        const response = await fetch("/geoTable/coordinates");
        const data = await response.json();

        expect(data).toEqual([
            { name: "Shiley", latMin: 45.572, latMax: 45.573, longMin: -122.725, longMax: -122.724 }
        ]);
    });

    test("Checks if user is near a building", () => {
        const userLat = 45.5725;
        const userLong = -122.7245;
        const building = { latMin: 45.572, latMax: 45.573, longMin: -122.725, longMax: -122.724 };

        expect(isUserNearBuilding(userLat, userLong, building)).toBe(true);
    });

    test("Update display should modify popups correctly", () => {
        document.body.innerHTML = `
            <div class="default-message"></div>
            <div class="default-message"></div>
            <div class="loader"></div>
            <div class="welcome-pop-up"></div>
        `;

        updateDisplay("Shiley");

        expect(document.querySelector(".default-message").innerHTML).toBe("Near by buildings:");
        expect(document.querySelector(".welcome-pop-up").style.display).toBe("flex");
    });

    test("Toggles fullscreen mode", () => {
        document.fullscreenElement = null;
        toggleFullscreen();
        expect(document.fullscreenElement).not.toBe(null);
    });

    test("Update button text based on fullscreen mode", () => {
        document.body.innerHTML = `<button id="fullScreenButton">Fullscreen</button>`;
        updateButton();
        expect(document.getElementById("fullScreenButton").textContent).toBe("Fullscreen");
    });
});
