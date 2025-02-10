/**
 * TO DO:
 * 1. find the dimentions of the whole campus
 * 2. fill the cords object with every building
 * 3. add an animation loop that refreshes very few seconds (3-5)
 *    to update user's location as they move around the campus
 */



const MAP_WIDTH = 350;
const MAP_HEIGHT = 250;

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
    library: { // TO DO: 
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
    }

}

function getUserCords() {
    navigator.geolocation.getCurrentPosition(position => {
    const { accuracy, latitude, longitude, altitude, heading, speed } = position.coords;

    // Get the map container
    const map = document.getElementById("map");
    const loadingMessage = document.querySelector(".loading-message");
    const popup = document.querySelector(".welcome-pop-up");

    // Ensure the element exists before modifying innerHTML
    if (map) {
        map.innerHTML = `<iframe width="${MAP_WIDTH}" height="${MAP_HEIGHT}" 
            src="https://maps.google.com/maps?q=${latitude},${longitude}&z=18&output=embed"
            frameborder="0" allowfullscreen></iframe>`;
    } else {
        console.error("Element with id 'map' not found.");
    }
        details.innerHTML += `Latitude: ${latitude} <br>` ;
        details.innerHTML += `Longitude: ${longitude} <br>`;

        // add a 3 second delay before popup
        setTimeout(() => {
            if (checkWithinBounds(latitude, longitude, cords.dundon.latMin, cords.dundon.latMax, cords.dundon.longMin, cords.dundon.longMax)) {
                alert("Welcome to DB!");
            } else if (checkWithinBounds(latitude, longitude, cords.shiley.latMin, cords.shiley.latMax, cords.shiley.longMin, cords.shiley.longMax)) {
                loadingMessage.style.display = 'none';
                popup.style.visibility = 'visible';
                popup.innerHTML = 'Shiley School of Engineering!';
            } else if (checkWithinBounds(latitude, longitude, cords.library.latMin, cords.library.latMax, cords.library.longMin, cords.library.longMax)) {
                loadingMessage.style.display = 'none';
                popup.style.visibility = 'visible';
                popup.innerHTML = 'Clark Library!';
            }
        }, 3000);

    }, error => {
        console.error("Error getting location: ", error);
    });
}

// boolean function to check if user is near a building
function checkWithinBounds(lat, long, latMin, latMax, longMin, longMax) {
    return (lat >= latMin && lat <= latMax && long >= longMin && long <= longMax);
}


function main() {
    getUserCords();
}

main();