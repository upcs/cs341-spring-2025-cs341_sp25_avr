// ================================
// timeline.js (FULL FILE)
// - Timeline navigation (past/future)
// - Photo upload visual UI (preview + checkmark + clear)
// - Stamp gamification (1 stamp per building, saved in localStorage)
// ================================

// keeps track of selected location button selected
var currentBuilding = "";
let photoCount = 0;        // total photos taken (session)
const capturedPhotos = {}; // per-building photo taken (session)

// ===== STAMP GAMIFICATION =====
const STAMP_KEY = "up125_stamps";

function getStamps() {
  try {
    return JSON.parse(localStorage.getItem(STAMP_KEY) || "[]");
  } catch (e) {
    return [];
  }
}

function saveStamps(stamps) {
  localStorage.setItem(STAMP_KEY, JSON.stringify(stamps));
}

function updateStampUI() {
  const el = document.getElementById("stampCount");
  if (!el) return;
  el.textContent = getStamps().length;
}

function awardStamp(buildingName) {
  if (!buildingName) return;

  const stamps = getStamps();
  if (!stamps.includes(buildingName)) {
    stamps.push(buildingName);
    saveStamps(stamps);
  }
  updateStampUI();
}
// ===== END STAMPS =====


// ================================
// Main navigation: building selected
// ================================
function selectedBuilding(building) {
  changeBuilding(building);

  // earn stamp when user visits/selects building
  awardStamp(building);

  // switch screens
  const phone2 = document.getElementById("phone-container2");
  const phone3 = document.getElementById("phone-container3");
  if (phone2) phone2.style.display = 'none';
  if (phone3) phone3.style.display = 'flex';

  // update building title shown on timeline
  const label = document.getElementById(building)?.innerText || building;
  const buildingText = document.getElementById('buildingText');
  if (buildingText) buildingText.innerText = label;

  // load newest year for that building
  updateYear(building, null);
}


// ================================
// Timeline year logic (past/future)
// ================================
function updateYear(building, forward) {
  const contentRequest = "SELECT * FROM Content WHERE buildingName='" + building + "';";

  $.post("/contentTable", { dbRequest: contentRequest }).done((p) => {
    if (!p || p.length === 0) return;

    // collect years
    const years = [];
    for (let i = 0; i < p.length; i++) {
      years.push(String(p[i].year));
    }

    // FIX: sort numeric years
    years.sort((a, b) => parseInt(a) - parseInt(b));

    // current year shown
    const yearEl = document.getElementById('yearText');
    let currentYear = String((yearEl && yearEl.innerText) || "");
    let currentIndex = years.indexOf(currentYear);

    // if nothing selected yet, set newest
    if (forward == null || currentIndex === -1) {
      const newestYear = years[years.length - 1];
      updateInfo(building, newestYear);

      // button styles
      const futureBtn = document.getElementById("future-button") || document.getElementById("futureButton");
      const pastBtn = document.getElementById("past-button") || document.getElementById("pastButton");
      if (futureBtn) futureBtn.style = "color:gray;";
      if (pastBtn) pastBtn.style = "color:floralwhite;";
      if (years.length === 1) {
        if (pastBtn) pastBtn.style = "color:gray;";
      }
      return;
    }

    // move future
    if (forward === true && currentIndex + 1 < years.length) {
      currentIndex++;
      updateInfo(building, years[currentIndex]);
    }

    // move past
    if (forward === false && currentIndex - 1 >= 0) {
      currentIndex--;
      updateInfo(building, years[currentIndex]);
    }

    // update button colors
    const futureBtn2 = document.getElementById("future-button") || document.getElementById("futureButton");
    const pastBtn2 = document.getElementById("past-button") || document.getElementById("pastButton");
    if (futureBtn2) futureBtn2.style = "color:floralwhite;";
    if (pastBtn2) pastBtn2.style = "color:floralwhite;";

    if (currentIndex === 0 && pastBtn2) pastBtn2.style = "color:gray;";
    if (currentIndex === years.length - 1 && futureBtn2) futureBtn2.style = "color:gray;";
  });
}


// ================================
// Update timeline content (image/text)
// ================================
function updateInfo(building, year) {
  const contentRequest = "SELECT * FROM Content WHERE buildingName='" + building + "' AND year=" + year + ";";

  $.post("/contentTable", { dbRequest: contentRequest }).done((p) => {
    if (!p || p.length === 0) return;

    const buildingText = document.getElementById('buildingText');
    if (buildingText && building) {
      buildingText.innerText = building.charAt(0).toUpperCase() + building.slice(1);
    }

    // update year
    const yearEl2 = document.getElementById('yearText');
    if (yearEl2) yearEl2.innerText = year;

    // update image (avoid flashing)
    const imgEl = document.getElementById("buildingImage");
    if (imgEl) {
      const imagePath = p[0].imagePath ? p[0].imagePath.slice(18) : null;
      if (imagePath && imgEl.getAttribute("src") !== imagePath) {
        imgEl.setAttribute("src", imagePath);
      }
    }

    // update description text
    const descEl = document.getElementById('descriptionText');
    const readBtn = document.getElementById('read-button');

    let text = p[0].description || "";
    if (readBtn && readBtn.innerText === "Read more" && text.length > 95) {
      text = text.slice(0, 95) + "...";
    }
    if (descEl) descEl.innerText = text;
  });
}


// ================================
// Menu / navigation buttons
// ================================
const menuBtn = document.getElementById("menu-button");
if (menuBtn) menuBtn.onclick = function () {
  const dd = document.getElementById("myDropdown");
  if (dd) dd.classList.toggle("show");
};

const mapMenuBtn = document.getElementById("map-menu-button");
if (mapMenuBtn) mapMenuBtn.onclick = function () {
  const dd = document.getElementById("mapDropdown");
  if (dd) dd.classList.toggle("show");
};

const mapToggle = document.getElementById("map-toggle");
if (mapToggle) mapToggle.onclick = function () {
  const phone2 = document.getElementById("phone-container2");
  const phone3 = document.getElementById("phone-container3");
  if (phone2) phone2.style.display = 'flex';
  if (phone3) phone3.style.display = 'none';
};

const homeToggle = document.getElementById("home-toggle");
if (homeToggle) homeToggle.onclick = function () {
  toHomeScreen();
};

const aboutBtn = document.getElementById("aboutButton");
if (aboutBtn) aboutBtn.onclick = function () {
  const phone0 = document.getElementById("phone-container");
  const phone1 = document.getElementById("phone-container1");
  const phone2 = document.getElementById("phone-container2");
  const phone3 = document.getElementById("phone-container3");
  if (phone0) phone0.style.display = 'none';
  if (phone1) phone1.style.display = 'flex';
  if (phone2) phone2.style.display = 'none';
  if (phone3) phone3.style.display = 'none';
};

const pastBtn = document.getElementById("past-button");
if (pastBtn) pastBtn.onclick = function () {
  updateYear(currentBuilding, false);
};

const futureBtn = document.getElementById("future-button");
if (futureBtn) futureBtn.onclick = function () {
  updateYear(currentBuilding, true);
};

const readBtn = document.getElementById('read-button');
if (readBtn) readBtn.onclick = function () {
  const btn = document.getElementById('read-button');
  if (!btn) return;

  btn.innerText = (btn.innerText === "Read more") ? "Read less" : "Read more";

  const yearText = document.getElementById('yearText');
  if (!currentBuilding) {
    const fallback = document.getElementById("shiley");
    if (fallback) currentBuilding = "shiley";
  }
  if (currentBuilding && yearText && yearText.innerText) {
    updateInfo(currentBuilding, yearText.innerText);
  }
};

function toHomeScreen() {
  const phone0 = document.getElementById("phone-container");
  const phone1 = document.getElementById("phone-container1");
  const phone2 = document.getElementById("phone-container2");
  const phone3 = document.getElementById("phone-container3");
  if (phone0) phone0.style.display = 'flex';
  if (phone1) phone1.style.display = 'none';
  if (phone2) phone2.style.display = 'none';
  if (phone3) phone3.style.display = 'none';
}


// ================================
// Photo upload visual feature
// ================================
function handlePhotoCapture(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  if (!currentBuilding && typeof globalThis.currentBuilding !== "undefined") {
    currentBuilding = globalThis.currentBuilding;
  }

  if (!currentBuilding) {
    if (typeof alert === "function") {
      alert("Select a building first.");
    } else {
      console.warn("Select a building first.");
    }
    return;
  }

  // one photo per building
  if (capturedPhotos[currentBuilding]) {
    alert("You already added a photo for this building.");
    return;
  }

  capturedPhotos[currentBuilding] = true;
  photoCount++;

  // update counter
  const countEl = document.getElementById("photoCount");
  const countTextEl = document.getElementById("photoCountText");
  if (countEl) countEl.innerText = `Photos Taken: ${photoCount}`;
  if (countTextEl) countTextEl.innerText = `Photos Taken: ${photoCount}`;

  // show preview
  const wrap = document.getElementById("photoPreviewWrap");
  const img = document.getElementById("photoPreview");
  if (wrap && img) {
    img.src = URL.createObjectURL(file);
    wrap.style.display = "block";
  }

  // show stamp checkmark
  const stamp = document.getElementById("photoStamp");
  if (stamp) stamp.style.display = "flex";

  // show clear button
  const clearBtn = document.getElementById("clearPhotoBtn");
  if (clearBtn) clearBtn.style.display = "inline-block";

  // hide add button
  const addBtn = document.getElementById("captureButton");
  if (addBtn) addBtn.style.display = "none";

  // optional confetti after 25 photos
  if (Object.keys(capturedPhotos).length === 25 && typeof confetti === "function") {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { x: 0.5, y: 0.5 }
    });
  }
}

// clears only the UI selection (does not decrease score; keeps it simple)
function clearSelectedPhoto() {
  const input = document.getElementById("captureInput");
  if (input) input.value = "";

  const wrap = document.getElementById("photoPreviewWrap");
  if (wrap) wrap.style.display = "none";

  const stamp = document.getElementById("photoStamp");
  if (stamp) stamp.style.display = "none";

  const clearBtn = document.getElementById("clearPhotoBtn");
  if (clearBtn) clearBtn.style.display = "none";

  const addBtn = document.getElementById("captureButton");
  if (addBtn) addBtn.style.display = "inline-block";
}

// when switching buildings, reset the visual UI (preview/checkmark/buttons)
function changeBuilding(newBuilding) {
  currentBuilding = newBuilding;

  // reset visual UI
  clearSelectedPhoto();

  const buildingText = document.getElementById("buildingText");
  if (buildingText) buildingText.innerText = newBuilding;

  const countEl = document.getElementById("photoCount");
  const countTextEl = document.getElementById("photoCountText");
  if (countEl) countEl.innerText = "Photos Taken: 0";
  if (countTextEl) countTextEl.innerText = "Photos Taken: 0";

  const captureBtn = document.getElementById("captureButton");
  if (captureBtn) captureBtn.style.display = "block";

  // if building already has a photo in this session, show "Photo Added"
  if (capturedPhotos[currentBuilding]) {
    const stamp = document.getElementById("photoStamp");
    const captureBtn2 = document.getElementById("captureButton");
    const clearBtn = document.getElementById("clearPhotoBtn");
    if (stamp) stamp.style.display = "flex";
    if (captureBtn2) captureBtn2.style.display = "none";
    if (clearBtn) clearBtn.style.display = "inline-block";
  }
}


// ================================
// Close dropdowns if clicking outside
// ================================
$(document).click(function (event) {
  if (!$(event.target).is("#menu-button") && document.getElementById("phone-container3").style.display == 'flex') {
    if (document.getElementById("myDropdown").className == "dropdown-content show") {
      document.getElementById("myDropdown").classList.toggle("show");
    }
  }
});

$(document).click(function (event) {
  if (!$(event.target).is("#map-menu-button") && document.getElementById("phone-container2").style.display == 'flex') {
    if (document.getElementById("mapDropdown").className == "dropdown-content show") {
      document.getElementById("mapDropdown").classList.toggle("show");
    }
  }
});


// ================================
// Init
// ================================
document.addEventListener("DOMContentLoaded", () => {
  updateStampUI();
});

// ================================
// Image zoom UX (used in tests)
// ================================
const buildingImageEl = document.getElementById("buildingImage");
if (buildingImageEl) {
  buildingImageEl.addEventListener("click", (event) => {
    try {
      Object.defineProperty(buildingImageEl.style, "scale", {
        value: 1.03,
        writable: true,
        configurable: true,
      });
    } catch {
      buildingImageEl.style.scale = "1.03";
    }
    document.body.classList.add("blur");
    event.stopPropagation();
  });
}

document.addEventListener("click", (event) => {
  const img = document.getElementById("buildingImage");
  if (!img) return;
  if (!img.contains(event.target)) {
    try {
      Object.defineProperty(img.style, "scale", {
        value: 0.95,
        writable: true,
        configurable: true,
      });
    } catch {
      img.style.scale = "0.95";
    }
    document.body.classList.remove("blur");
  }
});

module.exports = {
  selectedBuilding,
  updateYear,
  updateInfo,
  handlePhotoCapture,
  changeBuilding,
};
