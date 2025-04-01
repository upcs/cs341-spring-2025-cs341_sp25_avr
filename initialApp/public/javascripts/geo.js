let map, marker, circle, zoomed;


const buildingNames = ["shiley", "margo", "merlo", "chapel", "commons", "waldschmidt", 
    "db", "shiley marcos", "fields and sho", "beauchamp", "lund", 
    "chiles", "baseball", "library", "phouse", "plaze", "franz", 
    "buckley", "swindels", "romanaggi"];

const message = document.querySelectorAll(".default-message");
const loader = document.querySelector(".loader");
const popups = document.querySelectorAll(".welcome-pop-up");
const devButton = document.getElementById("debug-btn");

document.getElementById("startButton").onclick = function () {
    document.getElementById("phone-container").style.display = 'none';
    document.getElementById("phone-container2").style.display = 'flex';

    // only load the map when 'start button' is pressed or map is not present
    if (!map) {
        initMap();
    }
};


function initMap() {
    // defines the map 
    map = L.map('map', {
        center: [51.505, -0.09], 
        zoom: 13,
        zoomControl: false // This disables the zoom buttons
    });


    // gets the openStreetMap source
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    // access brower geolocation API 
    // watchPosition() sends back a new set of coords if user moves
    navigator.geolocation.watchPosition(success, error);
}


function success(pos) {
    const lat = pos.coords.latitude; 
    const lng = pos.coords.longitude;
    const accuracy = pos.coords.accuracy; // tracks the accuracy of the coords

    // if a circle exists then remove the previous one if user moves to new location
    // remove deplicate markers
    if (marker) {
        map.removeLayer(marker);
        map.removeLayer(circle);
    }
    marker = L.marker([lat, lng]).addTo(map);
    circle = L.circle([lat, lng], { radius: accuracy }).addTo(map); 

    // keep the map at the changed zoom level if user is moving
    if (!zoomed) {
        zoomed = map.fitBounds(circle.getBounds());
    }

    // change center of map dynammically based on current marker
    map.setView([lat, lng]);

    checkAllBuildings(lat, lng);
}

// hand errors if user location can't be found
function error() {
    if (err.code === 1) {
        alert("Please allow geolocation access");
    } else {
        alert("Cannot get current location");
    }
}




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

//store JSON data globally
let buildingsData = {}; 

//retreive the coordinates from JSON file (Written by Emma)
fetch('/geoTable/coordinates') 
    .then(response => response.json())
    .then(data => {
        buildingsData = data; 
        getUserCords();   
    })

    .catch(error => console.error("Error fetching building coordinates: ", error));


//gets coords from database
function getBuildingBounds(building, callback) {
    console.log("Fetching bounds from JSON for:", building);

    const bounds = buildingsData.find(b => b.name.toLowerCase() === building.toLowerCase());

    if (bounds) {
        //Return found building bounds
        callback(bounds);  
    } else {
        console.error("Building not found in JSON:", building);
        //Return null if the building isn't found
        callback(null);  
    }
}


// hide the 'tap icon' message at the beginning

function hideTapIconMessage() {
    message[1].style.display = 'none';
    message[1].style.color = 'gray';
    message[0].style.fontSize = '24px';
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



/**
 * checks if user is near any building 
 * updates popup button name and information 
 * 
 * @param userLat 
 * @param userLong 
 */
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


// changes the name of the info buttons based on the passed in string
function updateDisplay(building) {
    message[0].style.display = 'flex';
    message[0].innerHTML = 'Near by buildings:';
    message[1].style.display = 'flex';
    loader.style.display = 'none';
    popups[0].style.display = 'flex';
    popups[0].innerHTML = `${building}`;

}

/**
 * formats name of bulding 
 * 
 * @param buildingName
 * @returns 
 */
function formatBuildingName(buildingName) {
    const names = {
        shiley: "Shiley School of Engineering",
        lund: "Lund Family Hall",
        phouse: "Pilot House",
        chiles: "Chiles Center",
        buckley: "Buckley Center",
        swindels: "Swindels hall",
        romanaggi: "Romanaggi Hall"
    };
    return names[buildingName] || buildingName;
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


// // Chengen: main function was unnessary but I thought it was good for modularity 
// function main() {
    
//     hideTapIconMessage()

// }

hideTapIconMessage()


// module.exports = { getUserCoords, toggleFullscreen, updateButton, updateDisplay, isUserNearBuilding, checkAllBuildings };
