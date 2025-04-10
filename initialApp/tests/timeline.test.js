/**
 * @jest-environment jsdom
 */
const $ = require('jquery');

//make $ global BEFORE loading timeline.js
global.$ = $;
global.jQuery = $;

describe("Timeline tests:", () => {

    afterEach(() => {
        jest.clearAllMocks();
      });

    beforeEach(() => {  

        //Mock a post request
        $.post = jest.fn().mockReturnValue({
            done: (cb) => {
                cb([
                    { year: "2000", description: "Test description", imageURL: "test.jpg" }
                ]);
                return { fail: () => {} };
            }
        });
          
    
        //Set up the required HTML structure for the test
        document.body.innerHTML = `
            <div id="phone-container2" style="display:flex;"></div>
            <div id="phone-container3" style="display:none;"></div>
            <div id="buildingText"></div>
            <button id="read-button">Read more</button>
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

    });


 //Make sure the correct container is loaded and the correct text
    test('sets currentBuilding and updates display/text', async () => {

        const { selectedBuilding } = require("../public/javascripts/timeline.js");

    await selectedBuilding('shiley');

    expect(document.getElementById('phone-container2').style.display).toBe('none');
    expect(document.getElementById('phone-container3').style.display).toBe('flex');
    expect(document.getElementById('buildingText').innerText).toBe('Shiley Hall');

    });


    test('updateInfo sets year and description', async () => {
       
        const { updateInfo } = require("../public/javascripts/timeline.js");
       
        updateInfo('shiley', '2009');
    
        expect(document.getElementById('yearText').innerText).toBe('2009');
        expect(document.getElementById('descriptionText').innerText).toBe('Test description');
    });




    test('updateInfo sets year, description, and image correctly', async () => {
        const { updateInfo } = require("../public/javascripts/timeline.js");
    
        // Set initial innerText so we can check the change
        document.getElementById('yearText').innerText = '1990';
        document.getElementById('read-button').innerText = 'Read more';
    
        $.post = jest.fn().mockReturnValue({
            done: (cb) => {
                cb([
                    { description: "A very long test description that exceeds ninety-five characters easily for Read more behavior." }
                ]);
            }
        });
    
        await updateInfo('shiley', '2009');
    
        expect(document.getElementById('yearText').innerText).toBe('2009');
        expect(document.getElementById('descriptionText').innerText)
  .toBe("A very long test description that exceeds ninety-five characters easily for Read more behavior.");
    });


    test('updateYear navigates to future year', async () => {
        const { updateYear } = require("../public/javascripts/timeline.js");
    
        document.getElementById('yearText').innerText = '2000';
    
        $.post = jest.fn().mockReturnValue({
            done: (cb) => {
                cb([
                    { year: "2000", description: "Old" },
                    { year: "2005", description: "New" }
                ]);
            }
        });
    
        await updateYear('shiley', true);
    
        expect(document.getElementById('yearText').innerText).toBe('2005');
    });

    test('updateYear navigates to past year', async () => {
        const { updateYear } = require("../public/javascripts/timeline.js");
    
        document.getElementById('yearText').innerText = '2005';
    
        $.post = jest.fn().mockReturnValue({
            done: (cb) => {
                cb([
                    { year: "2000", description: "Old" },
                    { year: "2005", description: "New" }
                ]);
            }
        });
    
        await updateYear('shiley', false);
    
        expect(document.getElementById('yearText').innerText).toBe('2000');
    });

    test('updateYear with null sets most recent year and grays out future button', async () => {
        const { updateYear } = require("../public/javascripts/timeline.js");
    
        document.getElementById('yearText').innerText = '2000';
    
        $.post = jest.fn().mockReturnValue({
            done: (cb) => {
                cb([
                    { year: "2000", description: "Old" },
                    { year: "2010", description: "Newest" }
                ]);
            }
        });
    
        await updateYear('shiley', null);
    
        expect(document.getElementById('yearText').innerText).toBe('2010');
        expect(document.getElementById('future-button').style.color).toBe('gray');
    });

    test('read-button toggles text and calls updateInfo', async () => {
        const { updateInfo } = require("../public/javascripts/timeline.js");
    
        const spy = jest.spyOn(require("../public/javascripts/timeline.js"), 'updateInfo');
    
        document.getElementById('read-button').click();
    
        expect(document.getElementById('read-button').innerText).toBe('Read less');
        expect(spy).toHaveBeenCalled();
    });

    test('menu-button toggles dropdown visibility', () => {
        const dropdown = document.getElementById("myDropdown");
        const button = document.getElementById("menu-button");
    
        expect(dropdown.classList.contains("show")).toBe(false);
        button.click();
        expect(dropdown.classList.contains("show")).toBe(true);
    });

    test('home-toggle shows home screen', () => {
        const button = document.getElementById("home-toggle");
        button.click();
        expect(document.getElementById("phone-container").style.display).toBe("flex");
    });
    
    test('aboutButton shows about section', () => {
        const button = document.getElementById("aboutButton");
        button.click();
        expect(document.getElementById("phone-container1").style.display).toBe("flex");
    });
    
    test('map-toggle switches to map view', () => {
        const button = document.getElementById("map-toggle");
        button.click();
        expect(document.getElementById("phone-container2").style.display).toBe("flex");
    });

    test('clicking on image zooms and applies blur', () => {
        const image = document.getElementById("buildingImage");
        const clickEvent = new MouseEvent("click", { bubbles: true });
        image.dispatchEvent(clickEvent);
        expect(image.style.scale).toBe("1.03");
    });
    
    test('clicking outside image resets zoom and blur', () => {
        const clickEvent = new MouseEvent("click", { bubbles: true });
        document.body.dispatchEvent(clickEvent);
        expect(document.getElementById("buildingImage").style.scale).toBe("0.95");
    });

    test('DOMContentLoaded triggers updateInfo with 2009', () => {
        const spy = jest.spyOn(require("../public/javascripts/timeline.js"), 'updateInfo');
    
        document.dispatchEvent(new Event("DOMContentLoaded"));
        expect(spy).toHaveBeenCalledWith("shiley", "2009");
    });

});