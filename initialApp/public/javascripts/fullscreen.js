/**
 * @jest-environment jsdom
 */

describe("Fullscreen functionality", () => {
    let button;

    beforeEach(() => {
        //Set up a fake fullscreen button in the DOM
        document.body.innerHTML = `<button id="fullScreenButton">Fullscreen</button>`;

        //Mock all the fullscreen methods
        document.documentElement.requestFullscreen = jest.fn();
        document.exitFullscreen = jest.fn();

        //Re-require the script so the event listeners bind
        require("../public/javascripts/fullscreen");

        button = document.getElementById("fullScreenButton");
    });

    afterEach(() => {
        jest.resetModules(); // Clear the require cache
    });

    test("clicking the button should request fullscreen if not in fullscreen", () => {
        //Fake not being in fullscreen
        document.fullscreenElement = null;

        //Simulate a click
        button.click();

        expect(document.documentElement.requestFullscreen).toHaveBeenCalled();
        expect(button.textContent).toBe("Minimize");
    });

    test("clicking the button should exit fullscreen if already in fullscreen", () => {
        //Fake being in fullscreen
        document.fullscreenElement = true;

        //Simulate a click
        button.click();

        expect(document.exitFullscreen).toHaveBeenCalled();
        expect(button.textContent).toBe("Fullscreen");
    });

    test("updateButton() sets button text based on fullscreen state", () => {
        const event = new Event("fullscreenchange");

        //Simulate entering fullscreen
        document.fullscreenElement = true;
        document.dispatchEvent(event);
        expect(button.textContent).toBe("Minimize");

        //Simulate exiting fullscreen
        document.fullscreenElement = null;
        document.dispatchEvent(event);
        expect(button.textContent).toBe("Fullscreen");
    });
});