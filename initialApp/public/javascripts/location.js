function togglePopups() {
  const popups = document.querySelectorAll('.popup');
  if (popups.length === 0) {
    console.warn('No popups (.popup) found in the DOM.');
    return;
  }
  popups.forEach((popup) => {
    const isHidden = popup.style.display === 'none';
    popup.style.display = isHidden ? 'block' : 'none';
    popup.setAttribute('aria-hidden', !isHidden);
  });
}

function initializeLocation() {
  const debugButton = document.getElementById('debug-btn');
  if (debugButton) {
    debugButton.addEventListener('click', togglePopups);
  } else {
    console.warn('Debug button (debug-btn) is not found in the DOM.');
  }
}

// Export the functions for testing
module.exports = { initializeLocation, togglePopups };


