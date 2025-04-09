

//keeps track of selected location button selected
var currentBuilding = "shiley"


//functions for timeline 

//when location button is selected updates screen and timeline info to match
function selectedBuilding(building) {
    currentBuilding = building
    document.getElementById("phone-container2").style.display = 'none';
    document.getElementById("phone-container3").style.display = 'flex';
    updateYear(building, null)
    //updates building name & timeline related visuals
    document.getElementById('buildingText').innerText = document.getElementById(building).innerText
    updateYear(building, null)
}

//determines year of next event/timeline if possible, then calls updateInfo 
//building for database and forward boolean for future(true) or past(false) in timeline
function updateYear(building, forward) {
    //if year is null, returns array of years from building
    contentRequest = "SELECT * FROM Content WHERE buildingName='" + building + "';"

    $.post("/contentTable", { dbRequest: contentRequest }).done((p) => {
        const years = [];
        for (let i = 0; i < p.length; i++) {
            years[i] = p[i].year
        }

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

        //grays or whites out future and past buttons if event is possible
        document.getElementById("future-button").style = "color:floralwhite;"
        document.getElementById("past-button").style = "color:floralwhite;"
        if (currentIndex == 0) {
            document.getElementById("past-button").style = "color:gray;"
        }
        if (currentIndex == years.length - 1) {
            document.getElementById("future-button").style = "color:gray;"
        }

    })
}

//updates all of the relevant texts and images to new event 
function updateInfo(building, year) {
    var contentRequest = "SELECT * FROM Content WHERE buildingName='" + building + "' AND year=" + year + ";"
    $.post("/contentTable", { dbRequest: contentRequest }).done((p) => {

        //updates image to new current year, only if year changes to avoid flashing/needless update
        if (year != document.getElementById('yearText').innerText) {
            const imagePath = "archiveContent\\" + building + "\\" + year + ".jpg"
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

document.getElementById("map-toggle").onclick = function () {
    document.getElementById("myDropdown").classList.toggle("show")
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
