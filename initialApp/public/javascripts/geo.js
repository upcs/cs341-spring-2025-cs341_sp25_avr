
// reference the HTML elements 
let map;
let marker;

const message = document.querySelectorAll(".default-message");
const loader = document.querySelector(".loader");
const popups = document.querySelectorAll(".welcome-pop-up");
const devButton = document.getElementById("debug-btn");

const buildingNames = ["shiley", "margo", "merlo", "chapel", "commons", "waldschmidt", 
                        "db", "shiley marcos", "fields and sho", "beauchamp", "lund", 
                        "chiles", "baseball", "library", "phouse", "plaze", "franz", 
                        "buckley", "swindels", "romanaggi"];


devButton.addEventListener('click', () => {
   // Check if all popups are currently displayed
   const allVisible = Array.from(popups).some((popup, index) => 
       index != 0 && popup.style.display === "flex"
   );

    // Toggle display based on current state
    popups.forEach((popup, index) => {
        if (index != 0) {
            popup.style.display = allVisible ? "none" : "flex";
        }
        

       
    });

});


//gets coords from database
function getBuildingBounds(building, callback) {
    console.log("test");
    $.post("/geoTable", { buildingName: building }).done((response) => {
        console.log(response);
        const bounds = response[0];
        callback(bounds);
    }).fail(() => {
        console.error("Error fetching orders. Please try again");
        callback(null);
    });
}


// hide the 'tap icon' message at the beginning
message[1].style.display = 'none';
message[1].style.color = 'gray';
message[0].style.fontSize = '24px';

let buildingsData = {}; // store JSON data globally

// retreive the coordinates from JSON file
fetch('/geoTable/coordinates') 
    .then(response => response.json())
    .then(data => {
        buildingsData = data; 
        getUserCords();   
    })

    .catch(error => console.error("Error fetching building coordinates: ", error));

// initiate the google maps with marker
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

    getUserCoords(); // Get initial user location
}

// get the user's coordinates and check if they're near a building
function getUserCoords() {
    navigator.geolocation.getCurrentPosition(position => {
        const { latitude, longitude } = position.coords;

        console.log(`coords: ${latitude}, ${longitude}`);

        // Update the map's center
        map.setCenter({ lat: latitude, lng: longitude });

        // Move markter to new location
        marker.setPosition({ lat: latitude, lng: longitude });


        // update the cordinates in HTML
        // details.innerHTML = `Latitude: ${latitude} <br> Longitude: ${longitude} <br>`;
        
        checkAllBuildings(latitude, longitude);

    }, error => {
        console.error("Error getting location: ", error);
    });
}

// check if user is within the rectangle radius of a building
function isUserNearBuilding(userLat, userLong, building) {
    return (
        userLat >= building.latMin &&
        userLat <= building.latMax && 
        userLong >= building.longMin && 
        userLong <= building.longMax
    );
}

// check all building bounds
function checkAllBuildings(userLat, userLong) {
    buildingNames.forEach(building => {
        getBuildingBounds(building, (bounds) => {
            if (bounds && isUserNearBuilding(userLat, userLong, bounds)) {

                let displayName = formatBuildingName(building);

                updateDisplay(displayName);

                popups[0].addEventListener('click', ()=> {
                    if (window.selectedBuilding) {
                        document.getElementById("phone-container2").style.display = 'none';
                        document.getElementById("phone-container3").style.display = 'flex';
                        selectedBuilding(building);
                    }
                    
                });
            }
        });
    })
}


// const { selectedBuilding } = await import("./timeline.js");

// changes the name of the info buttons based on the passed in string
function updateDisplay(building) {
    message[0].style.display = 'flex';
    message[0].innerHTML = 'Near by buildings:';
    message[1].style.display = 'flex';
    loader.style.display = 'none';
    popups[0].style.display = 'flex';
    popups[0].innerHTML = `${building}`;

}

function formatBuildingName(dbName) {
    const names = {
        shiley: "Shiley School of Engineering",
        lund: "Lund Family Hall",
        phouse: "Pilot House",
        chiles: "Chiles Center",
        buckley: "Cuckley Center",
        swindels: "Swindels hall",
        romanaggi: "Romanaggi Hall"
    };
    return names[dbName] || dbName;
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

// document.querySelector(".welcome-pop-up").onclick = function () {
//     document.getElementById("phone-container2").style.display = 'none';
//     document.getElementById("phone-container3").style.display = 'flex';
    
// };

// document.getElementById("aboutButton").onclick = function () {
//     window.location.href = "about.html";
// };


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
    getUserCoords();
}
main();

module.exports = { getUserCoords, toggleFullscreen, updateButton, updateDisplay, isUserNearBuilding, checkAllBuildings };
