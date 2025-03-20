// Reference the HTML elements
const map = document.getElementById("map");
const details = document.getElementById("details");
const debugButton = document.getElementById("debug-btn");
const popups = document.querySelectorAll(".welcome-pop-up");
const messages = document.querySelectorAll(".default-message");
const loader = document.querySelector(".loader");

// Constants for map dimensions
const MAP_WIDTH = 350;
const MAP_HEIGHT = 350;

// Campus building coordinates
const cords = {
  shiley: { latMax: 45.5724, latMin: 45.5713, longMin: -122.7287, longMax: -122.7272 },
  dundon: { latMax: 45.57294, latMin: 45.572, longMin: -122.72585, longMax: -122.72401 },
  library: { latMax: 45.57323, latMin: 45.57231, longMin: -122.72739, longMax: -122.72599 },
  franz: { latMax: 45.57294, latMin: 45.572, longMin: -122.72585, longMax: -122.72401 },
  waldschmidt: { latMax: 45.57216, latMin: 45.571368, longMin: -122.72512, longMax: -122.72395 },
};

// Function to get user's coordinates
function getUserCords() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        updateMap(latitude, longitude);
        updateDetails(latitude, longitude);
        updatePopups(latitude, longitude);
      },
      (error) => {
        console.error("Error getting location:", error);
      }
    );
  } else {
    console.error("Geolocation is not supported by this browser.");
  }
}

// Helper function to update the map
function updateMap(latitude, longitude) {
  if (map) {
    map.innerHTML = `<iframe width="${MAP_WIDTH}" height="${MAP_HEIGHT}" 
      src="https://maps.google.com/maps?q=${latitude},${longitude}&z=18&output=embed"
      frameborder="0" style="border:0;"></iframe>`;
  } else {
    console.error("Element with id 'map' not found.");
  }
}

// Helper function to update the details section
function updateDetails(latitude, longitude) {
  if (details) {
    details.innerHTML = `Latitude: ${latitude} <br> Longitude: ${longitude}`;
  } else {
    console.error("Element with id 'details' not found.");
  }
}

// Helper function to update popups based on location
function updatePopups(latitude, longitude) {
  setTimeout(() => {
    let locationName = getLocationName(latitude, longitude);
    updateDisplay(locationName);
  }, 3000); // 3-second delay
}

// Function to get location name based on coordinates
function getLocationName(lat, long) {
  switch (true) {
    case checkWithinBounds(lat, long, cords.dundon.latMin, cords.dundon.latMax, cords.dundon.longMin, cords.dundon.longMax):
      return "Dundon-Berchtold Hall";
    case checkWithinBounds(lat, long, cords.shiley.latMin, cords.shiley.latMax, cords.shiley.longMin, cords.shiley.longMax):
      return "Shiley School of Engineering";
    case checkWithinBounds(lat, long, cords.library.latMin, cords.library.latMax, cords.library.longMin, cords.library.longMax):
      return "Clark Library";
    case checkWithinBounds(lat, long, cords.waldschmidt.latMin, cords.waldschmidt.latMax, cords.waldschmidt.longMin, cords.waldschmidt.longMax):
      return "Waldschmidt Hall";
    default:
      return "Location not recognized";
  }
}

// Boolean function to check if user is near a building
function checkWithinBounds(lat, long, latMin, latMax, longMin, longMax) {
  return lat >= latMin && lat <= latMax && long >= longMin && long <= longMax;
}

// Function to update display
function updateDisplay(building) {
  if (messages[0]) {
    messages[0].style.display = "flex";
    messages[0].innerHTML = "Nearby buildings:";
  }
  if (messages[1]) {
    messages[1].style.display = "flex";
  }
  if (loader) {
    loader.style.display = "none";
  }
  if (popups[0]) {
    popups[0].style.display = "flex";
    popups[0].innerHTML = `${building}!`;
  }
}

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

// Main function
function main() {
  getUserCords();
}

main();

// Export functions for testing
module.exports = { getUserCords, checkWithinBounds, updateDisplay, getLocationName };


