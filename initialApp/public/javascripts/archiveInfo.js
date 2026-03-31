function toggleReadMore(readButton, archiveInfo) {
  if (!readButton || !archiveInfo) return;

  const isExpanded = archiveInfo.classList.contains("expanded");
  if (isExpanded) {
    archiveInfo.classList.remove("expanded");
    readButton.textContent = "Read more";
  } else {
    archiveInfo.classList.add("expanded");
    readButton.textContent = "Read less";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const button = document.getElementById("read-button");
  const content = document.getElementById("archive-info");
  if (button && content) {
    button.addEventListener("click", () => toggleReadMore(button, content));
  }
});

module.exports = { toggleReadMore };
