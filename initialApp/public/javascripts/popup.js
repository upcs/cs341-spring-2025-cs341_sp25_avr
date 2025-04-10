const startBtn = document.getElementById("startButton");
const okBtn = document.getElementById("close-popup");
const popupDisplay = document.getElementById("popupDisplay");


okBtn.addEventListener('click', () => {
    closePopup();
});

startBtn.addEventListener('click', () => {
    openPopup();
});

function openPopup() {
    popupDisplay.classList.add("open-popup");
  }
  
  function closePopup() {
    popupDisplay.classList.remove("open-popup");
  }

  module.exports = { openPopup, closePopup };
