// public/javascripts/geo.js

function getUserCoords() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const details = document.getElementById("details");
                if (details) {
                    details.innerHTML = `Latitude: ${latitude}, Longitude: ${longitude}`;
                }
            },
            (error) => {
                console.error("Geolocation error:", error);
            }
        );
    } else {
        console.error("Geolocation is not supported by this browser.");
    }
}

// Export for Jest testing
module.exports = { getUserCoords };
