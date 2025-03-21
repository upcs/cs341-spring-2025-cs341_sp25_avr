// Function to handle page navigation
function navigateTo(page) {
    if (page === "home") {
        window.location.href = "index.html";
    } else if (page === "map") {
        window.location.href = "map.html";
    } else if (page === "geo") {
        window.location.href = "geo.html";
    } else {
        console.error("Invalid page selection");
    }
}

// Attach event listeners to menu/home buttons
document.addEventListener("DOMContentLoaded", () => {
    const homeButton = document.getElementById("home-button");
    const mapButton = document.getElementById("map-button");
    const geoButton = document.getElementById("geo-button");

    if (homeButton) {
        homeButton.addEventListener("click", () => navigateTo("home"));
    }
    if (mapButton) {
        mapButton.addEventListener("click", () => navigateTo("map"));
    }
    if (geoButton) {
        geoButton.addEventListener("click", () => navigateTo("geo"));
    }
});
module.exports = { navigateTo }; // Export navigateTo for testing
