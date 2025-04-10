//Global Variables for map
let map, marker, userCircle, zoomed;

const buildings = [
    { name: "shiley", lat: 45.571873864875734, long: -122.72794184135778, radius: 45 },
    { name: "mago", lat: 45.57331, long: -122.72814, radius: 30 },
    { name: "merlo", lat: 45.574691857551194, long: -122.72736804819188, radius: 60 },
    { name: "chapel", lat: 45.57118703901212, long: -122.7264409613001, radius: 30 },
    { name: "commons", lat: 45.570988740190316, long: -122.72718436706296, radius: 50 },
    { name: "waldschmidt", lat: 45.57179775808421, long: -122.72453264579713, radius: 30 },
    { name: "rigley", lat: 45.57179775808421, long: -122.72453264579713, radius: 30 },
    { name: "db", lat: 45.57248530060549, long: -122.72485586136415, radius: 50 },
    { name: "shiley marcos", lat: 45.57190748329964, long: -122.72902599935568, radius: 30 },
    { name: "fields", lat: 45.57587409580648, long: -122.73199424973225, radius: 60 },
    { name: "beauchamp", lat: 45.57524932809868, long: -122.73030501111376, radius: 60 },
    { name: "lund", lat: 45.57604110730614, long: -122.72961827161971, radius: 60 },
    { name: "chiles", lat: 45.575106641718605, long: -122.72849170246482, radius: 60 },
    { name: "baseball", lat: 45.57399546899834, long: -122.72950172424201, radius: 80 },
    { name: "library", lat: 45.5727862031439, long: -122.72673322150519, radius: 40 },
    { name: "phouse", lat: 45.57309068265263, long: -122.72558883489508, radius: 30 },
    { name: "franz", lat: 45.572660826406874, long: -122.72771208733339, radius: 35 },
    { name: "buckley", lat: 45.572048180689166, long: -122.72603884019847, radius: 55 },
    { name: "swindels", lat: 45.571190951614135, long: -122.72523084877547, radius: 30 },
    { name: "romanaggi", lat: 45.57184274643443, long: -122.72562621977794, radius: 30 },
    { name: "kenna", lat: 45.572863768825215, long: -122.72306821624528, radius: 50 },
    { name: "christie", lat: 45.572271114493795, long: -122.72378158347465, radius: 40 }
];



const okBtn = document.getElementById("close-popup-btn");
const overlay= document.querySelector(".overlay");
const helpBtn = document.getElementById("help-btn");
const message = document.querySelectorAll(".default-message");
const loader = document.querySelector(".loader");
const popups = document.querySelectorAll(".building-info-btn"); // gets all the popups for each building
const devButton = document.getElementById("debug-btn");



// ------ START BUTTON ------
document.getElementById("startButton").onclick = function () {
    document.getElementById("phone-container").style.display = 'none';
    document.getElementById("phone-container2").style.display = 'flex';

    // only load the map when 'start button' is pressed or map is not present
    if (!map) {
        initMap();
    }
};

// ------ WELCOME POPUP & HELP BUTTON-------
okBtn.addEventListener('click', () => {
    overlay.classList.add('hide');
});

helpBtn.addEventListener('click', () => {
    overlay.classList.remove('hide');
});


// ------ CREATE MAP ------
function initMap() {
    // defines the map 
    map = L.map('map', {
        center: [45.57190748329964, -122.72902599935568],
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


// if map was created 
function success(pos) {
    let userLat = pos.coords.latitude;
    let userLng = pos.coords.longitude;
    let accuracy = pos.coords.accuracy; // tracks the accuracy of the coords

    // if a circle exists then remove the previous one if user moves to new location
    // remove deplicate markers
    if (marker) {
        map.removeLayer(marker);
        map.removeLayer(userCircle);
    }
    // marker is set to user's current location
    marker = L.marker([userLat, userLng]).addTo(map);
    // circle to see the accuracy of the coordinate
    userCircle = L.circle([userLat, userLng], { radius: accuracy }).addTo(map);

    // used to store each circle's name so we know which circle belongs to which building
    let circles = {};

    // iterate through each building in the buildings array (line 3)
    buildings.forEach(building => {
        // make a new circle for each building 
        let circle = L.circle([building.lat, building.long], { radius: building.radius }).addTo(map);

        // add the building name to each circle
        circle.buildingName = building.name;

        // store circles in the object using building name as key
        // Ex: {"shiley", circle}
        circles[building.name] = circle;
    });

    // store the nearest building name as a variable 
    let nearbyBuilding = getBuildingName(userLat, userLng, circles);

    // if there is a building near by
    if (nearbyBuilding) {

        hideLoader(); // Only update for the nearby building

        const matchedPopup = document.getElementById(nearbyBuilding);
        
        if (matchedPopup) {
            matchedPopup.style.display = 'flex';

            matchedPopup.addEventListener('click', ()=> {
                if (window.selectedBuilding) {
                    document.getElementById("phone-container2").style.display = 'none';
                    document.getElementById("phone-container3").style.display = 'flex';
                    window.selectedBuilding(nearbyBuilding);
                }
            })
        }
    } else {
        popups.forEach(popup => {
            popup.style.display = 'none';
        });
    }
    // console.log("User is near:", nearbyBuilding ? nearbyBuilding : "No building");
    // console.log(circles);

    // keep the map at the changed zoom level if user is moving
    if (!zoomed) {
        zoomed = map.fitBounds(userCircle.getBounds());
    }
    // change center of map dynammically based on current marker
    map.setView([userLat, userLng]);
}

// hand errors if user location can't be found
function error() {
    if (err.code === 1) {
        alert("Please allow geolocation access");
    } else {
        alert("Cannot get current location");
    }
}



// ------ SHOW ALL LOCATIONS BUTTON ------

devButton.addEventListener('click', () => {
  
    popups.forEach((popup, index) => {
        popup.style.display = 'flex';
    });
});




// IMPORTANT: DON'T DELETE in case we want to move coords to data base
//gets coords from database
// function getBuildingBounds(building, callback) {
//     console.log("test");
//     $.post("/geoTable", { buildingName: building }).done((response) => {
//         console.log(response);
//         const bounds = response[0];
//         callback(bounds);
//     }).fail(() => {
//         console.error("Error fetching orders. Please try again");
//         callback(null);
//     });
// }


// hide the 'tap icon' message at the beginning

function hideTapIconMessage() {
    message[1].style.display = 'none';
    message[1].style.color = 'gray';
    message[0].style.fontSize = '24px';
}


// checks if user is inside the radius of a building
function isUserNearBuilding(userLat, userLng, circle) {
    let circleCenter = circle.getLatLng(); // gets the center coord of each building
    let radius = circle.getRadius(); // gets the radius of a the circle
    let distance = map.distance([userLat, userLng], circleCenter); // checks distance from circle center to user

    return distance <= radius; // true if user is inside radius 
}

/**
 * checks which building's circle a user is in
 * 
 * @param {int} userLat 
 * @param {int} userLng 
 * @param {Object} circles 
 * @returns name of a building
 */
function getBuildingName(userLat, userLng, circles) {
    for (let buildingName in circles) {
        let circle = circles[buildingName];
        if (isUserNearBuilding(userLat, userLng, circle)) {
            return buildingName; // Return the first matching building
        }
    }
    return null; // No matching building found
}


// hides the loading effect and updates display infomation 
function hideLoader() {
    message[0].style.display = 'flex';
    message[0].innerHTML = 'Near by buildings:';
    message[1].style.display = 'flex';
    loader.style.display = 'none';
}



hideTapIconMessage();

module.exports = {initMap, hideLoader, isUserNearBuilding, getBuildingName }
