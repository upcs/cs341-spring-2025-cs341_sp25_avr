
/**
 * TO DO:
 * 1.
 */

// reference the HTML elements 
let map;
let marker;

const message = document.querySelectorAll(".default-message");
const loader = document.querySelector(".loader");
const popups = document.querySelectorAll(".welcome-pop-up");
const devButton = document.getElementById("debug-btn");

//  developer button to display all the other pop ups
devButton.addEventListener('click', () => {
    popups.forEach((popup) => {
        popup.style.display = "flex";
    });
});


// hide the 'tap icon' message at the beginning
message[1].style.display = 'none';
message[1].style.color = 'gray';
message[0].style.fontSize = '24px';

// let buildingsData = {}; // store JSON data globally

// // retreive the coordinates from JSON file
// fetch('/coordinates.json')
//     .then(response => response.json())
//     .then(data => {
//         buildingsData = data;
//         getUserCords();
//     })
//     .catch(error => console.error("Error fetching bulding coordinates: ", error));

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 45.572, lng: -122.727 }, // Default center
        zoom: 18,
        disableDefaultUI: true, // Disable all default UI elements
        zoomControl: false,     // Disable zoom controls
        streetViewControl: false, // Disable street view controls
        mapTypeControl: false,  // Disable map type controls (satellite, terrain, etc.)
        fullscreenControl: false // Disable fullscreen button
    });
    marker = new google.maps.Marker({
        position: { lat: 45.572, lng: -122.727 },
        map: map,
        title: "Your Location",
    });

    getUserCords(); // Get initial user location
}

function getUserCords() {
    navigator.geolocation.getCurrentPosition(position => {
        const { latitude, longitude } = position.coords;

        console.log(`coords: ${latitude}, ${longitude}`);

        // Update the map's center
        map.setCenter({ lat: latitude, lng: longitude });

        // Move markter to new location
        marker.setPosition({ lat: latitude, lng: longitude });


        // update the cordinates in HTML
        // details.innerHTML = `Latitude: ${latitude} <br> Longitude: ${longitude} <br>`;

        // add a delay before popup
        setTimeout(() => {

            let locationName = "";

            switch(true) {
                case checkWithinBounds(latitude, longitude, cords.dundon.latMin, cords.dundon.latMax, cords.dundon.longMin, cords.dundon.longMax):
                    locationName = "Dundon-Berchtold Hall";
                    break;
                case checkWithinBounds(latitude, longitude, cords.shiley.latMin, cords.shiley.latMax, cords.shiley.longMin, cords.shiley.longMax):
                    locationName = "Shiley School of Engineering";
                    break;
                case checkWithinBounds(latitude, longitude, cords.library.latMin, cords.library.latMax, cords.library.longMin, cords.library.longMax):
                    locationName = "Clark Library";
                    break;
                case checkWithinBounds(latitude, longitude, cords.waldschmidt.latMin, cords.waldschmidt.latMax, cords.waldschmidt.longMin, cords.waldschmidt.longMax):
                    locationName = "Waldschmidt Hall";
                    break;
                default: 
                    locationName = "";
                    break;

            }

            // update the popup text 
            updateDisplay(locationName);

        }, 1000); // 3000ms = 3 seconds

    }, error => {
        console.error("Error getting location: ", error);
    });
}

function checkBounds(lat, long, latMin, latMax, longMin, longMax) {
    return (lat >= latMin && lat <= latMax && long >= longMin && long <= longMax);
}


// changes the name of the info buttons based on the passed in string
function updateDisplay(building) {
    message[0].style.display = 'flex';
    message[0].innerHTML = 'Near by buildings:';
    message[1].style.display = 'flex';
    loader.style.display = 'none';
    popups[0].style.display = 'flex';
    popups[0].innerHTML = `${building}`;
}


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

document.getElementById("startButton").onclick = function () {
    document.getElementById("phone-container").style.display = 'none';
    document.getElementById("phone-container2").style.display = 'flex';
};

document.querySelector(".welcome-pop-up").onclick = function () {
    document.getElementById("phone-container2").style.display = 'none';
    document.getElementById("phone-container3").style.display = 'flex';
};

document.getElementById("aboutButton").onclick = function () {
    window.location.href = "about.html";
};


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

// Listen for fullscreen changes and update the button text
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


// Chengen: main function was unnessary but I thought it was good for modularity 
function main() {
    // calls the function every 5 seconds to check user has moved
    // setInterval(getUserCords, 5000);
    // bug: it keeps asking for the user's lociation
    getUserCords();
}
main();

module.exports = { getUserCords, checkWithinBounds, updateDisplay };
