const startBtn = document.getElementById("startButton");
const okBtn = document.getElementById("close-popup");

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