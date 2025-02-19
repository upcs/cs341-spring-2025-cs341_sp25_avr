// public/javascripts/archiveInfo.js

document.addEventListener("DOMContentLoaded", () => {
    const readButton = document.getElementById("read-button");
    const archiveInfo = document.getElementById("archive-info");

    if (readButton && archiveInfo) {
        readButton.addEventListener("click", () => {
            if (archiveInfo.classList.contains("expanded")) {
                archiveInfo.classList.remove("expanded");
                readButton.textContent = "Read more";
            } else {
                archiveInfo.classList.add("expanded");
                readButton.textContent = "Read less";
            }
        });
    }
});

// Export functions for Jest testing
function toggleReadMore(button, content) {
    if (content.classList.contains("expanded")) {
        content.classList.remove("expanded");
        button.textContent = "Read more";
    } else {
        content.classList.add("expanded");
        button.textContent = "Read less";
    }
}

module.exports = { toggleReadMore };