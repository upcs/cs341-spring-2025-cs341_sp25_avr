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

// ------- HOME FULLSCREEN BUTTON ------
const btn = document.getElementById("fullScreenButton");
// ------- MAP FULLSCREEN BUTTON -------
const btn2 = document.getElementById("map-fullscreen-btn");

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

function toggleImageExpand(event) {
    const image = document.getElementById('buildingImage');
    
    // Check if the image is already in fullscreen mode
    if (!image.classList.contains('fullscreen-image')) {
        // Add the class to expand the image
        image.classList.add('fullscreen-image');
        document.body.classList.add('blur'); // Add blur to the body
        // Request fullscreen for the image
        if (image.requestFullscreen) {
            image.requestFullscreen();
        } else if (image.mozRequestFullScreen) {
            image.mozRequestFullScreen();
        } else if (image.webkitRequestFullscreen) {
            image.webkitRequestFullscreen();
        } else if (image.msRequestFullscreen) {
            image.msRequestFullscreen();
        }
    } else {
        // Remove the class to return to normal size
        image.classList.remove('fullscreen-image');
        document.body.classList.remove('blur'); // Remove blur from the body
        // Exit fullscreen if the image is in fullscreen
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
    
    // Prevent the click event from bubbling up to the document
    event.stopPropagation();
}

// Close the expanded image when clicking outside of it
document.addEventListener('click', function(event) {
    const image = document.getElementById('buildingImage');
    if (image.classList.contains('fullscreen-image')) {
        // Check if the click was outside the image
        if (!image.contains(event.target)) {
            image.classList.remove('fullscreen-image');
            document.body.classList.remove('blur'); // Remove blur from the body
            // Exit fullscreen if the image is in fullscreen
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    }
});

// // Listen for fullscreen changes and update the button text
document.addEventListener("fullscreenchange", updateButton);
document.addEventListener("webkitfullscreenchange", updateButton);
document.addEventListener("mozfullscreenchange", updateButton);
document.addEventListener("MSFullscreenChange", updateButton);

function updateButton() {
    if (document.fullscreenElement || document.webkitFullscreenElement) {
        btn.textContent = "Minimize";
        btn2.innerHTML = '<i class="fa-solid fa-down-left-and-up-right-to-center"></i>';
    } else {
        btn.textContent = "Fullscreen";
        btn2.innerHTML = '<i class="fa-solid fa-up-right-and-down-left-from-center"></i>';
    }
}

if (btn) {
    btn.addEventListener("click", toggleFullscreen);
  }
  if (btn2) {
    btn2.addEventListener("click", toggleFullscreen);
  }

module.exports = { toggleFullscreen, updateButton, goFullscreen }