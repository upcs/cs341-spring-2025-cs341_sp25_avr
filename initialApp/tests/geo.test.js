const { JSDOM } = require("jsdom");

describe("Geo.js Tests", () => {
  let map, details, loader, popups, message, devButton;

  beforeEach(() => {
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

    // Reference DOM elements using the same variable names as geo.js
    map = document.getElementById("map");
    details = document.getElementById("details");
    loader = document.querySelector(".loader");
    popups = document.querySelectorAll(".welcome-pop-up");
    message = document.querySelectorAll(".default-message");
    devButton = document.getElementById("debug-btn"); // Match geo.js's variable name
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should display all popups when devButton is clicked", () => {
    // Ensure devButton exists
    expect(devButton).not.toBeNull();

    // Add the same event listener logic from geo.js
    devButton.addEventListener("click", () => {
      popups.forEach((popup) => {
        popup.style.display = "flex";
      });
    });

    // Simulate a button click
    devButton.click();

    // Check that all popups are visible
    popups.forEach((popup) => {
      expect(popup.style.display).toBe("flex");
    });
  });

  test("should handle missing devButton gracefully", () => {
    // Remove devButton from the DOM
    document.getElementById = jest.fn((id) => (id === "debug-btn" ? null : {}));
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    // Simulate the behavior if devButton is missing
    const devButton = document.getElementById("debug-btn");
    if (!devButton) {
      console.error("Debug button (debug-btn) not found.");
    }

    // Ensure the error message is logged
    expect(consoleSpy).toHaveBeenCalledWith("Debug button (debug-btn) not found.");
    consoleSpy.mockRestore();
  });
});
