// ------- FULL SCREEN BUTTON STUFF --------
function goFullscreen() {
    let elem = document.documentElement;
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
    }
}

document.addEventListener("DOMContentLoaded", function () {
    if (sessionStorage.getItem("fullscreen") === "true") {
        goFullscreen();
    }
});

const btn = document.getElementById("fullScreenButton");

function toggleFullscreen() {
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        // Enter fullscreen
        let elem = document.documentElement;
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.mozRequestFullScreen) {
            elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        }
        btn.textContent = "Minimize";
    } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
        btn.textContent = "Fullscreen";
    }
}

// // Listen for fullscreen changes and update the button text
document.addEventListener("fullscreenchange", updateButton);
document.addEventListener("webkitfullscreenchange", updateButton);
document.addEventListener("mozfullscreenchange", updateButton);
document.addEventListener("MSFullscreenChange", updateButton);

function updateButton() {
    if (document.fullscreenElement || document.webkitFullscreenElement) {
        btn.textContent = "Minimize";
    } else {
        btn.textContent = "Fullscreen";
    }
}

btn.addEventListener("click", toggleFullscreen);

module.exports = { toggleFullscreen, updateButton }