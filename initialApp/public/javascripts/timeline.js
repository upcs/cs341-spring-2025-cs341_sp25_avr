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
  document.getElementById("phone-container2").style.display = 'none';
  document.getElementById("phone-container3").style.display = 'flex';

  // update building title shown on timeline
  const label = document.getElementById(building)?.innerText || building;
  document.getElementById('buildingText').innerText = label;

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
    let currentYear = String(document.getElementById('yearText').innerText || "");
    let currentIndex = years.indexOf(currentYear);

    // if nothing selected yet, set newest
    if (forward == null || currentIndex === -1) {
      const newestYear = years[years.length - 1];
      updateInfo(building, newestYear);

      // button styles
      document.getElementById("future-button").style = "color:gray;";
      document.getElementById("past-button").style = "color:floralwhite;";
      if (years.length === 1) {
        document.getElementById("past-button").style = "color:gray;";
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
    document.getElementById("future-button").style = "color:floralwhite;";
    document.getElementById("past-button").style = "color:floralwhite;";

    if (currentIndex === 0) document.getElementById("past-button").style = "color:gray;";
    if (currentIndex === years.length - 1) document.getElementById("future-button").style = "color:gray;";
  });
}


// ================================
// Update timeline content (image/text)
// ================================
function updateInfo(building, year) {
  const contentRequest = "SELECT * FROM Content WHERE buildingName='" + building + "' AND year=" + year + ";";

  $.post("/contentTable", { dbRequest: contentRequest }).done((p) => {
    if (!p || p.length === 0) return;

    // update year
    document.getElementById('yearText').innerText = year;

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
document.getElementById("menu-button").onclick = function () {
  document.getElementById("myDropdown").classList.toggle("show");
};

document.getElementById("map-menu-button").onclick = function () {
  document.getElementById("mapDropdown").classList.toggle("show");
};

document.getElementById("map-toggle").onclick = function () {
  document.getElementById("phone-container2").style.display = 'flex';
  document.getElementById("phone-container3").style.display = 'none';
};

document.getElementById("home-toggle").onclick = function () {
  toHomeScreen();
};

document.getElementById("aboutButton").onclick = function () {
  document.getElementById("phone-container").style.display = 'none';
  document.getElementById("phone-container1").style.display = 'flex';
  document.getElementById("phone-container2").style.display = 'none';
  document.getElementById("phone-container3").style.display = 'none';
};

document.getElementById("past-button").onclick = function () {
  updateYear(currentBuilding, false);
};

document.getElementById("future-button").onclick = function () {
  updateYear(currentBuilding, true);
};

document.getElementById('read-button').onclick = function () {
  const btn = document.getElementById('read-button');
  if (!btn) return;

  btn.innerText = (btn.innerText === "Read more") ? "Read less" : "Read more";

  if (currentBuilding && document.getElementById('yearText').innerText) {
    updateInfo(currentBuilding, document.getElementById('yearText').innerText);
  }
};

function toHomeScreen() {
  document.getElementById("phone-container").style.display = 'flex';
  document.getElementById("phone-container1").style.display = 'none';
  document.getElementById("phone-container2").style.display = 'none';
  document.getElementById("phone-container3").style.display = 'none';
}


// ================================
// Photo upload visual feature
// ================================
function handlePhotoCapture(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  if (!currentBuilding) {
    alert("Select a building first.");
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
  if (countEl) countEl.innerText = `Photos Taken: ${photoCount}`;

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
//connect stamps
  selectedBuilding(building)


  // if building already has a photo in this session, show "Photo Added"
  if (capturedPhotos[currentBuilding]) {
    document.getElementById("photoStamp").style.display = "flex";
    document.getElementById("captureButton").style.display = "none";
    document.getElementById("clearPhotoBtn").style.display = "inline-block";
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

function selectedBuilding(building) {

    // ✅ AUTO STAMP WHEN BUILDING IS VIEWED
    const stamps = JSON.parse(localStorage.getItem("questStamps") || "{}");
    if (!stamps[building]) {
        stamps[building] = true;
        localStorage.setItem("questStamps", JSON.stringify(stamps));
    }

    changeBuilding(building);
    document.getElementById("phone-container2").style.display = 'none';
    document.getElementById("phone-container3").style.display = 'flex';
    updateYear(building, null);

    document.getElementById('buildingText').innerText =
        document.getElementById(building).innerText;

    updateYear(building, null);
}

// ================================
// Init
// ================================
document.addEventListener("DOMContentLoaded", () => {
  updateStampUI();
});
// QUEST BUTTON NAVIGATION
document.addEventListener("DOMContentLoaded", () => {

  const questBtn = document.getElementById("questButton");

  if (questBtn) {
    questBtn.onclick = function () {
      document.getElementById("phone-container").style.display = 'none';
      document.getElementById("phone-container1").style.display = 'none';
      document.getElementById("phone-container2").style.display = 'none';
      document.getElementById("phone-container3").style.display = 'none';
      document.getElementById("phone-container4").style.display = 'flex';
    };
  }

});
// =========================
// QUEST QR SCAN SYSTEM
// =========================

function getStamps(){
  return JSON.parse(localStorage.getItem("questStamps") || "{}");
}

function saveStamp(building){
  const s = getStamps();
  s[building] = true;
  localStorage.setItem("questStamps", JSON.stringify(s));
  renderStampGrid();
}

function renderStampGrid(){
  const grid = document.getElementById("stampGrid");
  if(!grid) return;

  const stamps = getStamps();
  grid.innerHTML = "";

  Object.keys(stamps).forEach(b=>{
    const d = document.createElement("div");
    d.className = "stamp";
    d.innerText = b;
    grid.appendChild(d);
  });
}



// QR SCANNER

function startScanner(){

  const readerDiv = document.getElementById("reader");
  readerDiv.innerHTML = "";

  const html5QrCode = new Html5Qrcode("reader");

  html5QrCode.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: 250 },
    (decodedText) => {

      // EXPECT QR CODES CONTAIN BUILDING ID
      // Example QR content: shiley  or  waldschmidt

      saveStamp(decodedText);

      html5QrCode.stop();
      alert("Stamp collected for: " + decodedText);

    },
    (errorMessage) => {}
  );
}


// attach scan button
document.addEventListener("DOMContentLoaded", ()=>{
  const scanBtn = document.getElementById("scanBtn");
  if(scanBtn){
    scanBtn.onclick = startScanner;
  }
  renderStampGrid();
});
