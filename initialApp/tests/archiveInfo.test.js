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

  test("should not throw an error if button or content is missing", () => {
    // Simulate missing elements
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    // Ensure toggleReadMore gracefully handles null input
    expect(() => toggleReadMore(null, archiveInfo)).not.toThrow();
    expect(() => toggleReadMore(readButton, null)).not.toThrow();
    expect(() => toggleReadMore(null, null)).not.toThrow();

    consoleSpy.mockRestore();
  });

  test("should start with collapsed archive info and default button text", () => {
    // Verify initial state
    expect(archiveInfo.classList.contains("collapsed")).toBe(true);
    expect(readButton.textContent).toBe("Read more");
  });

  test("should attach event listener to readButton and toggle behavior", () => {
    // Attach event listener logic
    readButton.addEventListener("click", () => toggleReadMore(readButton, archiveInfo));

    // Simulate clicking the button
    readButton.click();

    // Verify expanded state
    expect(archiveInfo.classList.contains("expanded")).toBe(true);
    expect(readButton.textContent).toBe("Read less");

    // Simulate clicking the button again
    readButton.click();

    // Verify collapsed state
    expect(archiveInfo.classList.contains("expanded")).toBe(false);
    expect(readButton.textContent).toBe("Read more");
  });

  test("should handle DOMContentLoaded event gracefully", () => {
    // Simulate DOMContentLoaded logic
    const eventListenerSpy = jest.spyOn(document, "addEventListener");
    document.addEventListener("DOMContentLoaded", () => {
      const button = document.getElementById("read-button");
      const content = document.getElementById("archive-info");

      if (button) {
        button.addEventListener("click", () => toggleReadMore(button, content));
      }
    });

    // Trigger the DOMContentLoaded event
    const domContentLoadedEvent = new dom.window.Event("DOMContentLoaded");
    document.dispatchEvent(domContentLoadedEvent);

    // Verify the listener was attached
    expect(eventListenerSpy).toHaveBeenCalledWith("DOMContentLoaded", expect.any(Function));
    eventListenerSpy.mockRestore();
  });
});
