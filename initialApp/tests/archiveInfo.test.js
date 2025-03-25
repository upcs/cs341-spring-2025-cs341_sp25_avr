const { JSDOM } = require("jsdom");
const { toggleReadMore } = require("../public/javascripts/archiveInfo");

describe("Archive Info Tests", () => {
  let dom, readButton, archiveInfo;

  beforeEach(() => {
    // Set up the mock HTML structure
    const html = `
      <!DOCTYPE html>
      <html>
        <body>
          <button id="read-button">Read more</button>
          <div id="archive-info" class="collapsed">Some archive information.</div>
        </body>
      </html>
    `;
    dom = new JSDOM(html);
    global.document = dom.window.document;

    // Reference DOM elements
    readButton = document.getElementById("read-button");
    archiveInfo = document.getElementById("archive-info");
  });

  afterEach(() => {
    jest.clearAllMocks();
    dom = null;
    readButton = null;
    archiveInfo = null;
  });

  // Basic functionality tests for `toggleReadMore`
  test("should expand archive info and update button text", () => {
    toggleReadMore(readButton, archiveInfo);

    // Verify expanded behavior
    expect(archiveInfo.classList.contains("expanded")).toBe(true);
    expect(readButton.textContent).toBe("Read less");
  });

  test("should collapse archive info and update button text", () => {
    // Pre-expand the content
    archiveInfo.classList.add("expanded");
    readButton.textContent = "Read less";

    toggleReadMore(readButton, archiveInfo);

    // Verify collapsed behavior
    expect(archiveInfo.classList.contains("expanded")).toBe(false);
    expect(readButton.textContent).toBe("Read more");
  });

  test("should not throw an error if button or content is null", () => {
    // Simulate missing elements
    expect(() => toggleReadMore(null, archiveInfo)).not.toThrow();
    expect(() => toggleReadMore(readButton, null)).not.toThrow();
    expect(() => toggleReadMore(null, null)).not.toThrow();
  });

  // Initial state tests
  test("should start with collapsed archive info and default button text", () => {
    // Verify initial state
    expect(archiveInfo.classList.contains("collapsed")).toBe(true);
    expect(readButton.textContent).toBe("Read more");
  });

  // DOMContentLoaded and event listener tests
  test("should attach event listener to readButton and toggle behavior", () => {
    document.addEventListener("DOMContentLoaded", () => {
      const button = document.getElementById("read-button");
      const content = document.getElementById("archive-info");

      if (button && content) {
        button.addEventListener("click", () => toggleReadMore(button, content));
      }
    });

    // Simulate the DOMContentLoaded event
    const domContentLoadedEvent = new dom.window.Event("DOMContentLoaded");
    document.dispatchEvent(domContentLoadedEvent);

    // Simulate clicking the button to expand
    readButton.click();
    expect(archiveInfo.classList.contains("expanded")).toBe(true);
    expect(readButton.textContent).toBe("Read less");

    // Simulate clicking the button to collapse
    readButton.click();
    expect(archiveInfo.classList.contains("expanded")).toBe(false);
    expect(readButton.textContent).toBe("Read more");
  });

  test("should not attach event listener if elements are missing", () => {
    document.body.innerHTML = ""; // Clear DOM
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    document.dispatchEvent(new Event("DOMContentLoaded"));

    expect(consoleSpy).not.toHaveBeenCalled(); // No errors should occur
    consoleSpy.mockRestore();
  });

  test("should handle undefined 'readButton' gracefully", () => {
    document.getElementById("read-button").remove();

    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    document.dispatchEvent(new Event("DOMContentLoaded"));

    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  // Extended edge case tests for `toggleReadMore`
  test("should handle unexpected class names on archiveInfo gracefully", () => {
    archiveInfo.className = "unexpected-class";
    toggleReadMore(readButton, archiveInfo);

    // Verify state
    expect(archiveInfo.classList.contains("expanded")).toBe(true); // Expanded regardless of initial class name
    expect(readButton.textContent).toBe("Read less");
  });

  test("should handle rapid toggle calls without breaking state", () => {
    toggleReadMore(readButton, archiveInfo); // First call (expand)
    toggleReadMore(readButton, archiveInfo); // Second call (collapse)
    toggleReadMore(readButton, archiveInfo); // Third call (expand)

    // Final state after three calls
    expect(archiveInfo.classList.contains("expanded")).toBe(true);
    expect(readButton.textContent).toBe("Read less");
  });

  test("should handle empty textContent on button", () => {
    readButton.textContent = ""; // Simulate unexpected state
    toggleReadMore(readButton, archiveInfo);

    // Verify expanded state
    expect(archiveInfo.classList.contains("expanded")).toBe(true);
    expect(readButton.textContent).toBe("Read less");
  });
});

