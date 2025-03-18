/**
 * TO DO:
 * 1. find the dimentions of the whole campus
 * 2. fill the cords object with every building
 * 3. add an animation loop that refreshes very few seconds (3-5)
 *    to update user's location as they move around the campus
 */

// reference the HTML elements 
const map = document.getElementById("map");
const message = document.querySelectorAll(".default-message");
const loader = document.querySelector(".loader");
const popups = document.querySelectorAll(".welcome-pop-up");
const devButton = document.getElementById("debug-btn");

// developer button to display all the other pop ups
devButton.addEventListener('click', () => {
    popups.forEach((popup) => {
        popup.style.display = "flex";
    });
});


// hide the 'tap icon' message at the beginning
message[1].style.display = 'none';
message[1].style.color = 'gray';
message[0].style.fontSize = '24px';

const MAP_WIDTH = 350;
const MAP_HEIGHT = 350;

// corrdinates of each building on campus
const cords = {
    shiley: {
        latMax: 45.572400,
        latMin: 45.571320,
        longMin: -122.728720,
        longMax: -122.727180
    },
    dundon: {
        latMax: 45.572940,
        latMin: 45.572000,
        longMin: -122.725850,
        longMax: -122.724010
    },
    library: {
        latMax: 45.573230,
        latMin: 45.572310,
        longMin: -122.727390,
        longMax: -122.725990
    },
    franz: { // TO DO:
        latMax: 45.572940,
        latMin: 45.572000,
        longMin: -122.725850,
        longMax: -122.724010
    },
    waldschmidt: {
        latMax: 45.572160,
        latMin: 45.571368,
        longMin: -122.725120,
        longMax: -122.723950
    }

}

function getUserCords() {
    navigator.geolocation.getCurrentPosition(position => {
        const { latitude, longitude } = position.coords;

        // Ensure the element exists before modifying innerHTML
        if (map) {
            map.innerHTML = `<iframe width="${MAP_WIDTH}" height="${MAP_HEIGHT}" 
                src="https://maps.google.com/maps?q=${latitude},${longitude}&z=18&output=embed&pb=!1m14!1m12!1m3!1d"
                frameborder="0" style="border:0;"></iframe>`;

        } else {
            console.error("Element with id 'map' not found.");
        }
        // update the cordinates in HTML
        details.innerHTML = `Latitude: ${latitude} <br> Longitude: ${longitude} <br>`;

        // add a delay before popup
        setTimeout(() => {

            // set an empty string for the location name
            let locationName = "";

            // checks location, set locationName based on the where user is
            switch (true) {
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
            // update the pop up based on the location 
            updateDisplay(locationName);

        }, 3000); // 3000ms = 3 seconds

    }, error => {
        console.error("Error getting location: ", error);
    });
}

// boolean function to check if user is near a building
function checkWithinBounds(lat, long, latMin, latMax, longMin, longMax) {
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

// Chengen: main function was unnessary but I thought it was good for modularity 
function main() {
    // calls the function every 5 seconds to check user has moved
    // setInterval(getUserCords, 5000);
    // bug: it keeps asking for the user's lociation

    getUserCords();
}

main();
