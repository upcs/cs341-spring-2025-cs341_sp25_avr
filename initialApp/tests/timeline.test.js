/**
 * @jest-environment jsdom
 */
const $ = require('jquery');

//make $ global BEFORE loading timeline.js
global.$ = $;
global.jQuery = $;

describe("Timeline tests:", () => {


    const $ = require('jquery');
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
          
        //global.capturedPhotos = { shiley: false };
    
        //Set up the required HTML structure for the test
        document.body.innerHTML = `
            
            <div id="shiley">Shiley Hall</div>
            <div id="yearText">2009</div>
            <div id="descriptionText">Test description</div>
            <div id="timelineContainer" class="d-none"></div>
            <div id="photoCountText">0</div>
            <div id="photoCount">0</div>
            <div id="photoStamp"></div>
            <div id="captureButton"></div>
            <button onclick="selectedBuilding('shiley')">Shiley</button>


            <!-- Building Image -->
            <img id="buildingImage" class="building-img" style="scale:1;" />

            <!-- Building Text -->
            <div id="buildingText"></div>

            <!-- Read More Button -->
            <button id="read-button">Read more</button>

            <!-- Dropdown and Menu Button -->
            <div id="myDropdown" class="dropdown-content show"></div>
            <div id="mapDropdown" class="dropdown-content show"></div>
            <button id="menu-button" class="show">Menu</button>
            <button id="map-menu-button" class="show">Menu</button>
           

            <!-- Phone Containers -->
            <div id="phone-container" style="display:flex;"></div>
            <div id="phone-container1" style="display:flex;"></div>
            <div id="phone-container2" style="display:flex;"></div>
            <div id="phone-container3" style="display: flex;"></div>


            <!-- Toggle Buttons -->
            <button id="home-toggle">Home</button>
            <button id="aboutButton">About</button>
            <button id="map-toggle" style="display:lex;">Map</button>
            <button id="future-button" style="blur"></button>
            <button id="past-button" style="blur"></button>

            <div id="info-pane" class="hidden">
      <div class="info-text"></div>
    </div>
    <div class="buildings">
      <div class="building" id="building1">Building 1</div>
    </div>
       
        `;

        global.buildings = {
            shiley: {
              name: "Shiley Hall",
              description: "Test description"
            }
          };
        
          global.currentBuilding = null;

        const {
            selectedBuilding,
            updateYear,
            updateInfo,
            handlePhotoCapture,
            changeBuilding
          } = require('../public/javascripts/timeline.js');

    });


//The ones that don't work yet :(
    

test('should update building and UI elements when a building is selected', () => {
    const { selectedBuilding } = require('../public/javascripts/timeline.js');
    const building = 'shiley';
    selectedBuilding(building);

    const buildingText = document.getElementById('buildingText');
    console.log(buildingText.innerText);  // Debugging line
    expect(buildingText).toBeTruthy();
    expect(buildingText.innerText).toBe('Shiley');
});

test('should update the timeline year when going forward or backward', async () => {
    const { updateYear } = require('../public/javascripts/timeline.js');

    const mockPost = jest.spyOn($, 'post').mockImplementation((url, data) => {
        return { 
            done: jest.fn((cb) => cb([
                { year: '2009', description: 'Test 2009' },
                { year: '2010', description: 'Test 2010' },
                { year: '2011', description: 'Test 2011' }
            ])) 
        };
    });

    const building = 'shiley';
    
    // Simulate calling updateYear for next year
    await updateYear(building, true);
    
    // Check UI updates and mock call
    expect(mockPost).toHaveBeenCalledWith(expect.stringContaining("shiley"));
    expect(document.getElementById('yearText').innerText).toBe('2010');

    // Now simulate going back to previous year
    await updateYear(building, false);
    expect(document.getElementById('yearText').innerText).toBe('2009');
});
    
test('read-button toggles text and calls updateInfo', () => {
    const { updateInfo } = require('../public/javascripts/timeline.js');
    const spy = jest.spyOn(updateInfo, 'mockImplementation');

    const button = document.getElementById('read-button');
    button.click();

    // Ensure the button text has been updated
    expect(button.innerText).toBe('Read less');
    expect(spy).toHaveBeenCalledWith("shiley", "2009");
});

test('menu-button toggles dropdown visibility', () => {
    const dropdown = document.getElementById('myDropdown');
    const button = document.getElementById('menu-button');

    // Simulate initial state where dropdown is not visible
    dropdown.classList.remove('show');
    expect(dropdown.classList.contains('show')).toBe(false);

    // Simulate button click to toggle dropdown visibility
    button.click();
    expect(dropdown.classList.contains('show')).toBe(true);

    // Simulate another click to hide dropdown
    button.click();
    expect(dropdown.classList.contains('show')).toBe(false);
});

test('handlePhotoCapture registers a photo and updates count/UI', () => {
    const { handlePhotoCapture } = require('../public/javascripts/timeline.js');

    
    const fileInput = document.createElement('input');
    fileInput.type = "file";
    const mockFile = new File(["dummy content"], "test.jpg", { type: "image/jpeg" });
    Object.defineProperty(fileInput, 'files', { value: [mockFile] });

    // Initialize global object
    global.capturedPhotos = { shiley: false };
    global.currentBuilding = "shiley";
    global.photoCount = 0;
    
    handlePhotoCapture({ target: fileInput });
    
    // Assert that photo count is updated
    expect(document.getElementById("photoCount").innerText).toBe("Photos Taken: 1");
    expect(document.getElementById("checkmarkImage")).not.toBeNull();
});

    test('DOMContentLoaded triggers updateInfo with 2009', () => {
        const timeline = require('../public/javascripts/timeline.js');
        const spy = jest.spyOn(timeline, 'updateInfo');
    
        document.body.setAttribute('data-year', '2009');
        global.currentBuilding = "shiley";
    
        document.dispatchEvent(new Event('DOMContentLoaded'));
    
        expect(spy).toHaveBeenCalledWith("shiley", "2009");
    });

    test('should update the building and reset photo state when changing buildings', () => {
        const{changeBuilding}=require('../public/javascripts/timeline.js')
        
        changeBuilding('Shiley');
    
        expect(buildingText.innerText).toBe('Shiley');
        expect(photoCountText.innerText).toBe('Photos Taken: 0');
        expect(captureButton.style.display).toBe('block');  // Capture button should be visible again
      });

    //   test('should update the year and change button styles', async () => {
    //     const{updateYear}=require('../public/javascripts/timeline.js')

    //     await updateYear('shiley', true);  // Going forward to the next year
    
    //     expect(document.getElementById("yearText").innerText).toBe('2000');
    //     expect(document.getElementById("futureButton").style.color).toBe('gray');
    //     expect(document.getElementById("pastButton").style.color).toBe('floralwhite');
    //   });

    



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
    
    test('aboutButton shows about section', () => {
        const button = document.getElementById("aboutButton");
        button.click();
    
        // Check if the about container is shown
        const container = document.getElementById("phone-container1");
        expect(container.style.display).toBe("flex");
    });

    test('map-toggle switches to map view', () => {
    const button = document.getElementById("map-toggle");
    button.click();

    // Check if the map container is shown
    const container = document.getElementById("phone-container2");
    expect(container.style.display).toBe("flex");
    });

    test('home-toggle shows home screen', () => {
        const button = document.getElementById("home-toggle");
        button.click();
    
        // Check if the correct container is shown
        const container = document.getElementById("phone-container");
        expect(container.style.display).toBe("flex");
    });

    test('clicking on image zooms and applies blur', () => {
        const image = document.getElementById("buildingImage");
        const clickEvent = new MouseEvent("click", { bubbles: true });
        image.dispatchEvent(clickEvent);
        expect(parseFloat(image.style.scale)).toBeCloseTo(1.03);
    });
    
    test('clicking outside image resets zoom and blur', () => {
        const clickEvent = new MouseEvent("click", { bubbles: true });
        document.body.dispatchEvent(clickEvent);
        expect(document.getElementById("buildingImage").style.scale).toBeCloseTo(0.95);
    });

    test('selectedBuilding updates UI and calls updateYear', () => {
        const { selectedBuilding } = require('../public/javascripts/timeline.js');  
    
        // Call the selectedBuilding function
        selectedBuilding("shiley");
    
        // Ensure DOM elements are updated
        const buildingText = document.getElementById("buildingText");
        const descriptionText = document.getElementById("descriptionText");
        
        // Add a delay to allow async updates to DOM (if any)
        setTimeout(() => {
            expect(buildingText.innerText).toBe('Shiley Hall');
            expect(descriptionText.innerText).toBe('Test description');
            expect(document.getElementById("phone-container2").style.display).toBe('none');
            expect(document.getElementById("phone-container3").style.display).toBe('flex');
        }, 0);
    });

});