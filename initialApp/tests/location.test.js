const { JSDOM } = require("jsdom");
const { getUserCoords } = require("../public/javascripts/geo");

describe("getUserCoords Function Tests", () => {
  let document, detailsElement;

  beforeEach(() => {
    // Set up a mock DOM
    const html = `
      <!DOCTYPE html>
      <html>
        <body>
          <div id="details"></div>
        </body>
      </html>`;
    const dom = new JSDOM(html);
    global.document = dom.window.document;
    global.window = dom.window;

    // Mock navigator.geolocation
    global.navigator.geolocation = {
      getCurrentPosition: jest.fn(),
    };

    // Reference DOM element
    detailsElement = document.getElementById("details");
  });

  afterEach(() => {
    jest.clearAllMocks();
    global.document = undefined;
    global.window = undefined;
  });

  test("should update details with latitude and longitude on successful geolocation", () => {
    const mockPosition = {
      coords: {
        latitude: 45.5725,
        longitude: -122.7265,
      },
    };

    // Mock getCurrentPosition to call success callback
    global.navigator.geolocation.getCurrentPosition.mockImplementation((success) =>
      success(mockPosition)
    );

    getUserCoords();

    // Check that the details are updated with coordinates
    expect(detailsElement.innerHTML).toContain("Latitude: 45.5725");
    expect(detailsElement.innerHTML).toContain("Longitude: -122.7265");
  });

  test("should log error on geolocation failure", () => {
    const mockError = { message: "User denied geolocation" };

    // Mock getCurrentPosition to call error callback
    global.navigator.geolocation.getCurrentPosition.mockImplementation((_, error) =>
      error(mockError)
    );

    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    getUserCoords();

    // Check that the error was logged
    expect(consoleSpy).toHaveBeenCalledWith("Geolocation error:", mockError);

    consoleSpy.mockRestore();
  });

  test("should log an error when geolocation is not supported", () => {
    // Remove geolocation from navigator
    global.navigator.geolocation = undefined;

    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    getUserCoords();

    // Check that the error was logged
    expect(consoleSpy).toHaveBeenCalledWith(
      "Geolocation is not supported by this browser."
    );

    consoleSpy.mockRestore();
  });

  test("should do nothing if details element is missing", () => {
    // Remove the details element from the DOM
    document.getElementById = jest.fn(() => null);

    const mockPosition = {
      coords: {
        latitude: 45.5725,
        longitude: -122.7265,
      },
    };

    global.navigator.geolocation.getCurrentPosition.mockImplementation((success) =>
      success(mockPosition)
    );

    expect(() => getUserCoords()).not.toThrow();
  });
});

