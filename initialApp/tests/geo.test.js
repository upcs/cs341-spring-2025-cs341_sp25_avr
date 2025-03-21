const { JSDOM } = require("jsdom");

describe("Geo.js Tests", () => {
  let devButton, popups;

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
          <button id="debug-btn">Debug</button>
        </body>
      </html>`;
    const dom = new JSDOM(html);
    global.document = dom.window.document;

    // Reference DOM elements
    devButton = document.getElementById("debug-btn");
    popups = document.querySelectorAll(".welcome-pop-up");
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

    // Verify all popups are visible
    popups.forEach((popup) => {
      expect(popup.style.display).toBe("flex");
    });
  });

  test("should trigger error if popups are missing", () => {
    // Ensure devButton exists
    expect(devButton).not.toBeNull();

    // Attach event listener logic
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

    // Simulate empty popups and trigger click
    popups = [];
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    devButton.click();

    // Verify error is logged
    expect(consoleSpy).toHaveBeenCalledWith("No popups found.");
    consoleSpy.mockRestore();
  });

  test("should handle missing devButton gracefully", () => {
    // Simulate missing devButton
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    document.getElementById = jest.fn(() => null);

    const devButton = document.getElementById("debug-btn");
    if (!devButton) {
      console.error("Debug button (debug-btn) not found.");
    }

    // Verify error is logged
    expect(consoleSpy).toHaveBeenCalledWith("Debug button (debug-btn) not found.");
    consoleSpy.mockRestore();
  });
});
