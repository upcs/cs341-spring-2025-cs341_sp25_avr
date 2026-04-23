/**
 * @jest-environment jsdom
 */

const $ = require("jquery");

let selectedBuilding;
let updateYear;
let updateInfo;
let handlePhotoCapture;
let changeBuilding;

function setupDOM() {
  document.body.innerHTML = `
    <button id="menu-button">Menu</button>
    <button id="map-menu-button">Menu</button>
    <button id="aboutButton">About</button>
    <button id="map-toggle">Map</button>
    <button id="home-toggle">Home</button>
    <button id="future-button"></button>
    <button id="past-button"></button>
    <button id="read-button">Read more</button>
    <div id="myDropdown" class="dropdown-content"></div>
    <div id="mapDropdown" class="dropdown-content"></div>
    <div id="yearText"></div>
    <div id="buildingText"></div>
    <div id="descriptionText"></div>
    <img id="buildingImage" class="building-img" style="scale:1;" />
    <div id="shiley">Shiley</div>
    <div id="stampCount">0</div>
    <div id="phone-container" style="display:flex;"></div>
    <div id="phone-container1" style="display:none;"></div>
    <div id="phone-container2" style="display:flex;"></div>
    <div id="phone-container3" style="display:none;"></div>
    <div id="photoCountText">0</div>
    <div id="photoCount">0</div>
    <div id="photoStamp"></div>
    <div id="captureButton"></div>
  `;
}

beforeEach(() => {
  jest.resetModules();
  setupDOM();

  $.post = jest.fn().mockReturnValue({
    done: (cb) => {
      cb([{ year: "2000", description: "Test description", imagePath: "initialApp/public/test.jpg" }]);
      return { fail: () => {} };
    },
  });

  global.$ = $;
  global.jQuery = $;
  global.URL.createObjectURL = jest.fn(() => "blob:test-image");
  localStorage.clear();

  ({ selectedBuilding, updateYear, updateInfo, handlePhotoCapture, changeBuilding } = require("../public/javascripts/timeline.js"));
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("Timeline tests", () => {
  test("selectedBuilding updates the active building and screen state", () => {
    selectedBuilding("shiley");

    expect(document.getElementById("buildingText").innerText).toBe("Shiley");
    expect(document.getElementById("phone-container2").style.display).toBe("none");
    expect(document.getElementById("phone-container3").style.display).toBe("flex");
  });

  test("updateInfo sets year and description", () => {
    updateInfo("shiley", "2009");

    expect(document.getElementById("buildingText").innerText).toBe("Shiley");
    expect(document.getElementById("yearText").innerText).toBe("2009");
    expect(document.getElementById("descriptionText").innerText).toBe("Test description");
  });

  test("updateYear with null chooses the newest year and updates button styles", () => {
    $.post = jest.fn().mockReturnValue({
      done: (cb) => {
        cb([
          { year: "2000", description: "Old" },
          { year: "2005", description: "New" },
        ]);
        return { fail: () => {} };
      },
    });

    updateYear("shiley", null);

    expect(document.getElementById("yearText").innerText).toBe("2005");
    expect(document.getElementById("future-button").style.color).toBe("gray");
    expect(document.getElementById("past-button").style.color).toBe("floralwhite");
  });

  test("updateYear moves forward and backward through the sorted years", () => {
    $.post = jest.fn().mockReturnValue({
      done: (cb) => {
        cb([
          { year: "2009", description: "Test 2009" },
          { year: "2010", description: "Test 2010" },
          { year: "2011", description: "Test 2011" },
        ]);
        return { fail: () => {} };
      },
    });

    document.getElementById("yearText").innerText = "2009";
    updateYear("shiley", true);
    expect(document.getElementById("yearText").innerText).toBe("2010");

    updateYear("shiley", false);
    expect(document.getElementById("yearText").innerText).toBe("2009");
  });

  test("read button toggles its label", () => {
    const button = document.getElementById("read-button");
    button.innerText = "Read more";

    button.click();
    expect(button.innerText).toBe("Read less");

    button.click();
    expect(button.innerText).toBe("Read more");
  });

  test("menu button toggles dropdown visibility", () => {
    const dropdown = document.getElementById("myDropdown");
    const button = document.getElementById("menu-button");

    expect(dropdown.classList.contains("show")).toBe(false);
    button.click();
    expect(dropdown.classList.contains("show")).toBe(true);
    button.click();
    expect(dropdown.classList.contains("show")).toBe(false);
  });

  test("handlePhotoCapture registers a photo and updates the UI", () => {
    changeBuilding("shiley");

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    Object.defineProperty(fileInput, "files", {
      value: [new File(["dummy content"], "test.jpg", { type: "image/jpeg" })],
    });

    handlePhotoCapture({ target: fileInput });

    expect(document.getElementById("photoCount").innerText).toBe("Photos Taken: 1");
    expect(document.getElementById("photoCountText").innerText).toBe("Photos Taken: 1");
    expect(document.getElementById("photoStamp").style.display).toBe("flex");
    expect(document.getElementById("captureButton").style.display).toBe("none");
  });

  test("changeBuilding resets the building title and photo UI", () => {
    changeBuilding("Shiley");

    expect(document.getElementById("buildingText").innerText).toBe("Shiley");
    expect(document.getElementById("photoCountText").innerText).toBe("Photos Taken: 0");
    expect(document.getElementById("captureButton").style.display).toBe("block");
  });
});
