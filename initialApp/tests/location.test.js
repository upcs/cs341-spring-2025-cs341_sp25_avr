const { getUserCoords } = require("../public/javascripts/location");

describe("getUserCoords Function", () => {
  let details;

  beforeEach(() => {
    // Set up mock DOM
    document.body.innerHTML = `
      <div id="details"></div>
    `;
    details = document.getElementById("details");

    // Reset global.navigator.geolocation before each test
    delete global.navigator.geolocation;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should update details with latitude and longitude on success", () => {
    // Mock navigator.geolocation
    const mockPosition = { coords: { latitude: 40.7128, longitude: -74.006 } };
    global.navigator.geolocation = {
      getCurrentPosition: jest.fn((successCallback) =>
        successCallback(mockPosition)
      ),
    };

    // Call the function
    getUserCoords();

    // Ensure getCurrentPosition was called
    expect(global.navigator.geolocation.getCurrentPosition).toHaveBeenCalled();

    // Verify that the details element was updated correctly
    expect(details.innerHTML).toBe("Latitude: 40.7128, Longitude: -74.006");
  });

  test("should log an error if geolocation fails", () => {
    // Mock navigator.geolocation with an error
    const mockError = { message: "User denied Geolocation" };
    global.navigator.geolocation = {
      getCurrentPosition: jest.fn((_, errorCallback) =>
        errorCallback(mockError)
      ),
    };

    // Spy on console.error
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    // Call the function
    getUserCoords();

    // Ensure getCurrentPosition was called
    expect(global.navigator.geolocation.getCurrentPosition).toHaveBeenCalled();

    // Verify that the error was logged
    expect(consoleSpy).toHaveBeenCalledWith("Geolocation error:", mockError);
    consoleSpy.mockRestore();
  });

  test("should log an error if geolocation is not supported", () => {
    // No navigator.geolocation support
    global.navigator.geolocation = undefined;

    // Spy on console.error
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    // Call the function
    getUserCoords();

    // Verify that the error was logged
    expect(consoleSpy).toHaveBeenCalledWith(
      "Geolocation is not supported by this browser."
    );
    consoleSpy.mockRestore();
  });

  test("should gracefully handle a missing 'details' element", () => {
    // Mock navigator.geolocation
    const mockPosition = { coords: { latitude: 34.0522, longitude: -118.2437 } };
    global.navigator.geolocation = {
      getCurrentPosition: jest.fn((successCallback) =>
        successCallback(mockPosition)
      ),
    };

    // Remove the "details" element from the DOM
    document.getElementById("details").remove();

    // Spy on console.error
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    // Call the function
    getUserCoords();

    // Ensure no error occurs
    expect(() => getUserCoords()).not.toThrow();

    // Verify that no error was logged (missing details is handled silently)
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
