describe("Archive Info Tests", () => {
  let toggleReadMore;

  beforeEach(() => {
    jest.resetModules();
    document.body.innerHTML = `
      <button id="read-button">Read more</button>
      <div id="archive-info" class="collapsed">Some archive information.</div>
    `;

    ({ toggleReadMore } = require("../public/javascripts/archiveInfo"));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("expands archive info and updates button text", () => {
    const readButton = document.getElementById("read-button");
    const archiveInfo = document.getElementById("archive-info");

    toggleReadMore(readButton, archiveInfo);

    expect(archiveInfo.classList.contains("expanded")).toBe(true);
    expect(readButton.textContent).toBe("Read less");
  });

  test("collapses archive info and updates button text", () => {
    const readButton = document.getElementById("read-button");
    const archiveInfo = document.getElementById("archive-info");

    archiveInfo.classList.add("expanded");
    readButton.textContent = "Read less";

    toggleReadMore(readButton, archiveInfo);

    expect(archiveInfo.classList.contains("expanded")).toBe(false);
    expect(readButton.textContent).toBe("Read more");
  });

  test("does not throw for missing elements", () => {
    const readButton = document.getElementById("read-button");
    const archiveInfo = document.getElementById("archive-info");

    expect(() => toggleReadMore(null, archiveInfo)).not.toThrow();
    expect(() => toggleReadMore(readButton, null)).not.toThrow();
    expect(() => toggleReadMore(null, null)).not.toThrow();
  });

  test("DOMContentLoaded handling does not throw when the elements exist", () => {
    expect(() => {
      document.dispatchEvent(new window.Event("DOMContentLoaded"));
    }).not.toThrow();
  });
});
