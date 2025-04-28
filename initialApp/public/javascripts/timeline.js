

//keeps track of selected location button selected
var currentBuilding = ""
let photoCount = 0; // Initialize photo count
const capturedPhotos = {}; // Object to track captured photos by building name

//functions for timeline 

function selectedBuilding(building) {
    changeBuilding(building); // Call changeBuilding to reset the photo state
    document.getElementById("phone-container2").style.display = 'none';
    document.getElementById("phone-container3").style.display = 'flex';
    updateYear(building, null);
    // Updates building name & timeline related visuals
    document.getElementById('buildingText').innerText = document.getElementById(building).innerText;
    updateYear(building, null);
}

//determines year of next event/timeline if possible, then calls updateInfo 
//building for database and forward boolean for future(true) or past(false) in timeline
function updateYear(building, forward) {
    //if year is null, returns array of years from building
    const contentRequest = "SELECT * FROM Content WHERE buildingName='" + building + "';"

    $.post("/contentTable", { dbRequest: contentRequest }).done((p) => {
        //for the building, puts all of the event years in an array
        const years = [];
        for (let i = 0; i < p.length; i++) {
            years[i] = p[i].year
        }
        years.sort

        //finds year and index of current event/year before anything is done
        let currentYear = document.getElementById('yearText').innerText
        let currentIndex = years.indexOf(currentYear);
        for (let i = 0; i < p.length; i++) {
            if (currentYear == p[i].year) {
                currentIndex = i;
            }
        }

        //if not going forwards or backwards, default is most recent year
        if (forward == null) {
            updateInfo(building, years[p.length - 1])
            document.getElementById("future-button").style = "color:gray;"
            document.getElementById("past-button").style = "color:floralwhite;"
            //if one event/year turns past button gray
            if (years.length - 1 == 0) {
                document.getElementById("past-button").style = "color:gray;"
            }
            return;
        }

        //goes to future year if possible and going forward
        if (currentIndex + 1 < years.length && forward == true) {
            currentIndex = currentIndex + 1
            currentYear = years[currentIndex]
            updateInfo(building, currentYear)
        }

        //goes to past year if possible and going backwards
        if (currentIndex > 0 && forward == false) {
            currentIndex = currentIndex - 1
            currentYear = years[currentIndex]
            updateInfo(building, currentYear)
        }

        //turns gray or stays whites text for future and past buttons if event is possible
        document.getElementById("future-button").style = "color:floralwhite;"
        document.getElementById("past-button").style = "color:floralwhite;"
        if (currentIndex == 0 || years.length - 1 == 0) {
            document.getElementById("past-button").style = "color:gray;"
        }
        if (currentIndex == years.length - 1) {
            document.getElementById("future-button").style = "color:gray;"
        }

    })
}

//updates all of the relevant texts and images to new event according to building and year
function updateInfo(building, year) {
    var contentRequest = "SELECT * FROM Content WHERE buildingName='" + building + "' AND year=" + year + ";"
    $.post("/contentTable", { dbRequest: contentRequest }).done((p) => {

        //gets building name and year from current photo
        var currentImage = document.getElementById("buildingImage").src
        var currentImage = currentImage.slice(document.getElementById("buildingImage").src.indexOf("archiveContent") + 15)

        //updates image to new current year, only if year or buiulding changes to avoid flashing/needless update
        if (year != currentImage.slice(-8, -4) || building != currentImage.slice(0, -9)) {
            //gets image path staating at archiveContent for relative pathing
            const imagePath = p[0].imagePath.slice(18);
            document.getElementById("buildingImage").setAttribute("src", imagePath)
        }

        //updates year to the new current year
        document.getElementById('yearText').innerText = year

        //updates description text to current year
        var text = p[0].description;
        //depending on if user selected to read more updates length of description text accordingly
        if (document.getElementById('read-button').innerText == "Read more" && text.length > 95) {
            document.getElementById('descriptionText').innerText = text.slice(0, 95) + "...";
        } else {
            document.getElementById('descriptionText').innerText = text;
        }

    })
}



//buttons on clicks

//toggles menu drop down
document.getElementById("menu-button").onclick = function () {
    document.getElementById("myDropdown").classList.toggle("show")
}
document.getElementById("map-menu-button").onclick = function () {
    document.getElementById("mapDropdown").classList.toggle("show")
}

document.getElementById("map-toggle").onclick = function () {
    document.getElementById("phone-container2").style.display = 'flex';
    document.getElementById("phone-container3").style.display = 'none';
}

document.getElementById("home-toggle").onclick = function () {
    toHomeScreen()
}

document.getElementById("aboutButton").onclick = function () {
    document.getElementById("phone-container").style.display = 'none';
    document.getElementById("phone-container1").style.display = 'flex';
    document.getElementById("phone-container2").style.display = 'none';
    document.getElementById("phone-container3").style.display = 'none';
}

document.getElementById("past-button").onclick = function () {
    updateYear(currentBuilding, false)
};

document.getElementById("future-button").onclick = function () {
    updateYear(currentBuilding, true)
};

document.getElementById('read-button').onclick = function () {
    var text = document.getElementById('read-button').innerText

    if (text === 'Read more') {
        document.getElementById('read-button').innerText = "Read less"
    } else {
        document.getElementById('read-button').innerText = "Read more"
    }

    updateInfo(currentBuilding, document.getElementById('yearText').innerText)
};


//navigation function for menu home
function toHomeScreen() {
    document.getElementById("phone-container").style.display = 'flex';
    document.getElementById("phone-container1").style.display = 'none';
    document.getElementById("phone-container2").style.display = 'none';
    document.getElementById("phone-container3").style.display = 'none';
}


//zoom in/enlarging photos
$(document).click(function (event) {
    //when clicking off of zoomed in image 
    if (!$(event.target).is("#buildingImage")) {
        document.getElementById("buildingImage").style.maxHeight = "90%"
        document.getElementById("buildingImage").style.scale = 0.95
        document.getElementById("menu-button").style.filter = "blur(0px)"
        document.getElementById("buildingText").style.filter = "blur(0px)"
        document.getElementById("yearText").style.filter = "blur(0px)"
        document.getElementById("descriptionText").style.filter = "blur(0px)"
        document.getElementById("read-button").style.filter = "blur(0px)"
        document.getElementById("past-button").style.filter = "blur(0px)"
        document.getElementById("future-button").style.filter = "blur(0px)"

        //when clicking on image to zoom in    
    } else if ($(event.target).is("#buildingImage")) {
        document.getElementById("buildingImage").style.scale = 1.03
        document.getElementById("buildingImage").style.maxHeight = "100%"
        document.getElementById("menu-button").style.filter = "blur(3px)"
        document.getElementById("buildingText").style.filter = "blur(3px)"
        document.getElementById("yearText").style.filter = "blur(3px)"
        document.getElementById("descriptionText").style.filter = "blur(3px)"
        document.getElementById("read-button").style.filter = "blur(3px)"
        document.getElementById("past-button").style.filter = "blur(3px)"
        document.getElementById("future-button").style.filter = "blur(3px)"
        //if dropdown is toggled, untoggles to hide it
        if (document.getElementById("myDropdown").className == "dropdown-content show") {
            document.getElementById("myDropdown").classList.toggle("show")
        }
    }
});



document.addEventListener("DOMContentLoaded", () => {
    updateInfo(currentBuilding, '2009');
});

// Function to handle photo capture
function handlePhotoCapture(event) {
    const file = event.target.files[0];

    if (file) {
        // Check if a photo has already been taken for the current building
        if (capturedPhotos[currentBuilding]) {
            alert(`You have already taken a photo for ${currentBuilding}.`);
            return; // Exit the function if a photo has already been taken
        }

        // Increment the photo count
        photoCount++;
        capturedPhotos[currentBuilding] = true; // Mark this building as having a photo taken
        document.getElementById('photoCount').innerText = `Photos Taken: ${photoCount}`;

        // Change the button to a checkmark
        const captureButton = document.getElementById('captureButton');
        captureButton.style.display = 'none'; // Hide the button
        const checkmark = document.createElement('img');
        checkmark.src = 'images/checkmark.png'; // Path to your checkmark image
        checkmark.style.width = '50px';
        checkmark.style.height = '50px';
        checkmark.id = 'checkmarkImage'; // Give it an ID for future reference
        document.querySelector('.capture-container').appendChild(checkmark); // Add checkmark to the container

        // Check if all buildings have been photographed
        if (Object.keys(capturedPhotos).length === 25) {
            // Add confetti
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { x: 0.5, y: 0.5 }
            });
        }
    }
}

// Function to change the building and reset photo capture state
function changeBuilding(newBuilding) {
    // Check if the building is changing
    if (currentBuilding !== newBuilding) {
        // If a photo was taken for the current building, do not decrement the count
        if (capturedPhotos[currentBuilding]) {
            // Just mark the previous building as not having a photo taken
            capturedPhotos[currentBuilding] = false;
        }

        // Update the building name
        currentBuilding = newBuilding; // Update the current building
        document.getElementById('buildingText').innerText = newBuilding;

        // Update the UI
        document.getElementById('photoCount').innerText = `Photos Taken: ${photoCount}`;
        document.getElementById('photoStamp').style.display = 'none'; // Hide the checkmark
        const checkmarkImage = document.getElementById('checkmarkImage');
        if (checkmarkImage) {
            checkmarkImage.remove(); // Remove the checkmark image if it exists
        }

        // Show the capture button again
        document.getElementById('captureButton').style.display = 'block';
    }
}


module.exports = { selectedBuilding, updateYear, updateInfo, changeBuilding, handlePhotoCapture };

