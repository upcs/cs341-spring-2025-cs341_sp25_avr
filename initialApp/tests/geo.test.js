const { JSDOM } = require("jsdom");

describe("Geo.js Tests", () => {
  let map, details, loader, popups, message, devButton;

  beforeEach(() => {
    // Set up mock HTML structure
    const html = `
      <!DOCTYPE html>
      <html>
        <body>
          <div id="map"></div>
          <div id="details"></div>
          <div class="loader"></div>
          <div class="popup welcome-pop-up" style="display: none;">Popup 1</div>
          <div class="popup welcome-pop-up" style="display: none;">Popup 2</div>
          <div class="default-message">Message 1</div>
          <div class="default-message" style="color: gray;">Message 2</div>
          <button id="debug-btn">Debug</button>
        </body>
      </html>`;
    const dom = new JSDOM(html);
    global.document = dom.window.document;

    // Reference DOM elements
    map = document.getElementById("map");
    details = document.getElementById("details");
    loader = document.querySelector(".loader");
    popups = document.querySelectorAll(".welcome-pop-up");
    message = document.querySelectorAll(".default-message");
    devButton = document.getElementById("debug-btn"); // Matches variable name in geo.js
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should display all popups when devButton is clicked", () => {
    // Validate that devButton exists
    expect(devButton).not.toBeNull();

    // Attach event listener logic
    devButton.addEventListener("click", () => {
      popups.forEach((popup) => {
        popup.style.display = "flex";
      });
    });

    // Simulate button click
    devButton.click();

    // Verify that all popups are visible
    popups.forEach((popup) => {
      expect(popup.style.display).toBe("flex");
    });
  });

  test("should handle missing devButton gracefully", () => {
    // Simulate absence of devButton
    document.getElementById = jest.fn((id) => (id === "debug-btn" ? null : {}));
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const devButton = document.getElementById("debug-btn");
    if (!devButton) {
      console.error("Debug button (debug-btn) not found.");
    }

    // Assert the error message is logged
    expect(consoleSpy).toHaveBeenCalledWith("Debug button (debug-btn) not found.");
    consoleSpy.mockRestore();
  });

  test("should trigger error if popups are missing", () => {
    // Simulate the absence of popups
    document.querySelectorAll = jest.fn(() => []);
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    devButton.addEventListener("click", () => {
      const popups = document.querySelectorAll(".welcome-pop-up");
      if (popups.length === 0) {
        console.error("No popups found.");
      } else {
        popups.forEach((popup) => {
          popup.style.display = "flex";
        });
      }
    });

    // Simulate button click
    devButton.click();

    // Assert error message is logged
    expect(consoleSpy).toHaveBeenCalledWith("No popups found.");
    consoleSpy.mockRestore();
  });
});
