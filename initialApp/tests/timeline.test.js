/**
 * @jest-environment jsdom
 */



describe("Timeline tests:", () => {

    afterEach(() => {
        jest.clearAllMocks();
      });

    beforeEach(() => {  

        const $ = require('jquery');
    
        //Set up the required HTML structure for the test
        document.body.innerHTML = `
            <div id="phone-container2" style="display:flex;"></div>
            <div id="phone-container3" style="display:none;"></div>
            <div id="buildingText"></div>
            <div id="shiley">Shiley Hall</div>
            <div id="yearText">2000</div>
            <div id="future-button" style=""></div>
            <div id="past-button" style=""></div>
            <div id="map-toggle"</div>
            <div id="home-toggle"</div>
            <div id="aboutButton"</div>
            <img id="buildingImage" />
            <div id="descriptionText"></div>
            <button id="read-button">Read more</button>
            <button id="menu-button"></button>
            <div id="myDropdown" class="dropdown-content"></div>
        `;
    
    
        const { selectedBuilding, 
            updateYear, 
            updateInfo 
        } = require("../public/javascripts/timeline.js");
    
        // global.alert = jest.fn(); // Mock alert
        // error.mockRestore?.();  // Restore real function

    });


 //Make sure the correct container is loaded and the correct text
  test('sets currentBuilding and updates display/text', () => {
    
    const $ = require('jquery');

    //Simulate a click on the start button
    //$('#menu-button').click();


    selectedBuilding('shiley');

    expect(document.getElementById('phone-container2').style.display).toBe('none');
    expect(document.getElementById('phone-container3').style.display).toBe('flex');
    expect(document.getElementById('buildingText').innerText).toBe('Shiley Hall');

  });




});