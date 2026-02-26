function getUserCoords() {
  const details = document.getElementById("details");

  if (!navigator.geolocation) {
    console.error("Geolocation is not supported by this browser.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      if (!details) return;
      details.innerHTML = `Latitude: ${position.coords.latitude}, Longitude: ${position.coords.longitude}`;
    },
    (error) => {
      console.error("Geolocation error:", error);
    }
  );
}

module.exports = { getUserCoords };
