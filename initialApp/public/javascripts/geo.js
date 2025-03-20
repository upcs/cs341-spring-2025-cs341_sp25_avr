// Reference the HTML elements
const map = document.getElementById("map");
const details = document.getElementById("details");
const debugButton = document.getElementById("debug-btn");
const popups = document.querySelectorAll(".welcome-pop-up");
const message = document.querySelectorAll(".default-message");
const loader = document.querySelector(".loader");

// Debug button functionality to toggle all popups
if (debugButton) {
  debugButton.addEventListener("click", () => {
    popups.forEach((popup) => {
      popup.style.display = popup.style.display === "none" ? "flex" : "none";
    });
  });
} else {
  console.warn("Debug button (debug-btn) is not found in the DOM.");
}

// Hide 'tap icon' message at the beginning
if (message[1]) {
  message[1].style.display = "none";
  message[1].style.color = "gray";
}
if (message[0]) {
  message[0].style.fontSize = "24px";
}

// Map dimensions
const MAP_WIDTH = 350;
const MAP_HEIGHT = 350;

// Campus building coordinates
const cords = {
  shiley: { latMax: 45.572400, latMin: 45.571320, longMin: -122.728720, longMax: -122.727180 },
  dundon: { latMax: 45.572940, latMin: 45.572000, longMin: -122.725850, longMax: -122.724010 },
  library: { latMax: 45.573230, latMin: 45.572310, longMin: -122.727390, longMax: -122.725990 },
  franz: { latMax: 45.572940, latMin: 45.572000, longMin: -122.725850, longMax: -122.724010 },
  waldschmidt: { latMax: 45.572160, latMin: 45.571368, longMin: -122.725120, longMax: -122.723950 },
};

// Function to get user's coordinates
function getUserCords() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        if (map) {
          map.innerHTML = `<iframe width="${MAP_WIDTH}" height="${MAP_HEIGHT}" 
            src="https://maps.google.com/maps?q=${latitude},${longitude}&z=18&output=embed"
            frameborder="0" style="border:0;"></iframe>`;
        } else {
          console.error("Element with id 'map' not found.");
        }

        if (details) {
          details.innerHTML = `Latitude: ${latitude} <br> Longitude: ${longitude}`;
        } else {
          console.error("Element with id 'details' not found.");
        }

        // Add delay before updating the popups
        setTimeout(() => {
          let locationName = "";

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
              locationName = "Location not recognized";
              break;
          }

          updateDisplay(locationName);
        }, 3000);
      },
      (error) => {
        console.error("Error getting location: ", error);
      }
    );
  } else {
    console.error("Geolocation is not supported by this browser.");
  }
}

// Boolean function to check if user is near a building
function checkWithinBounds(lat, long, latMin, latMax, longMin, longMax) {
  return lat >= latMin && lat <= latMax && long >= longMin && long <= longMax;
}

// Function to update display
function updateDisplay(building) {
  if (message[0]) {
    message[0].style.display = "flex";
    message[0].innerHTML = "Nearby buildings:";
  }
  if (message[1]) {
    message[1].style.display = "flex";
  }
  if (loader) {
    loader.style.display = "none";
  }
  if (popups[0]) {
    popups[0].style.display = "flex";
    popups[0].innerHTML = `${building}!`;
  }
}

// Main function
function main() {
  getUserCords();
}

main();

// Export for testing
module.exports = { getUserCords, checkWithinBounds, updateDisplay };

