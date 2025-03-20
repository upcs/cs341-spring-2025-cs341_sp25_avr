// public/javascripts/location.js

function initializeLocation() {
    const debugButton = document.getElementById('debug-btn');
    if (debugButton) {
        debugButton.addEventListener('click', () => {
            const popups = document.querySelectorAll('.popup');
            popups.forEach((popup) => {
                popup.style.display = popup.style.display === 'none' ? 'block' : 'none';
            });
        });
    } else {
        console.warn('Debug button (debug-btn) is not found in the DOM.');
    }
}

// Export the function
module.exports = { initializeLocation };

