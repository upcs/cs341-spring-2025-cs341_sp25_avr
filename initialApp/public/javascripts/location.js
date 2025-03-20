// Function to initialize the location functionality
function initializeLocation() {
  const debugButton = document.getElementById('debug-btn');
  if (debugButton) {
    // Ensure the event listener is added only once
    if (!debugButton.dataset.initialized) {
      debugButton.addEventListener('click', togglePopups);
      debugButton.dataset.initialized = true; // Mark as initialized
    }
  } else {
    console.warn('Debug button (debug-btn) is not found in the DOM.');
  }
}

// Function to toggle the visibility of popups
function togglePopups() {
  const popups = document.querySelectorAll('.popup');
  if (popups.length === 0) {
    console.warn('No popups (.popup) found in the DOM.');
    return;
  }

  popups.forEach((popup) => {
    // Warn if 'aria-hidden' is missing to improve accessibility
    if (!popup.hasAttribute('aria-hidden')) {
      console.warn(`Popup with id ${popup.id} is missing the 'aria-hidden' attribute.`);
    }

    // Toggle the visibility and accessibility state of the popup
    const isHidden = popup.style.display === 'none';
    popup.style.display = isHidden ? 'block' : 'none';
    popup.setAttribute('aria-hidden', String(!isHidden)); // Set aria-hidden attribute for accessibility
  });
}

// Export functions for modular usage or testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initializeLocation, togglePopups };
}



