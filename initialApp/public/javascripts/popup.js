function openPopup() {
  const popup = document.getElementById("popupDisplay");
  if (popup) popup.classList.add("open-popup");
}

function closePopup() {
  const popup = document.getElementById("popupDisplay");
  if (popup) popup.classList.remove("open-popup");
}

const startButton = document.getElementById("startButton");
if (startButton) {
  startButton.addEventListener("click", openPopup);
}

const closeButton = document.getElementById("close-popup");
if (closeButton) {
  closeButton.addEventListener("click", closePopup);
}

module.exports = { openPopup, closePopup };
