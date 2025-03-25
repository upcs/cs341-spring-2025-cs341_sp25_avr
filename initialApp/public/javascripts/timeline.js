
//setting variables for timeline
const descriptionPaths = {
    'chapel': {
        '1937': 'photoDescriptions\\chapel\\1937.txt',
        '1986': 'photoDescriptions\\chapel\\1986.txt',
        '1996': 'photoDescriptions\\chapel\\1996.txt',
        '2009': 'photoDescriptions\\chapel\\2009.txt',
    },

    'chiles': {
        '1984': 'photoDescriptions\\chiles\\1984.txt',
        '1997': 'photoDescriptions\\chiles\\1997.txt',
        '2008': 'photoDescriptions\\chiles\\2008.txt',
    },

    'christie': {
        '1911': 'photoDescriptions\\christie\\1911.txt',
        '1960': 'photoDescriptions\\christie\\1960.txt',
        '1978': 'photoDescriptions\\christie\\1978.txt',
        '2019': 'photoDescriptions\\christie\\2019.txt',
    },

    'commons': {
        '1957': 'photoDescriptions\\commons\\1957.txt',
        '1959': 'photoDescriptions\\commons\\1959.txt',
        '2010': 'photoDescriptions\\commons\\2010.txt',
    },

    'corrado': {
        '1998': 'photoDescriptions\\corrado\\1998.txt',
        '1999': 'photoDescriptions\\corrado\\1999.txt',
        '2019': 'photoDescriptions\\corrado\\2019.txt',
    },

    'db': {
        '1927': 'photoDescriptions\\db\\1927.txt',
        '1982': 'photoDescriptions\\db\\1982.txt',
        '2017': 'photoDescriptions\\db\\2017.txt',
        '2019': 'photoDescriptions\\db\\2019.txt',
    },

    'kenna': {
        '1959': 'photoDescriptions\\kenna\\1959.txt',
        '1984': 'photoDescriptions\\kenna\\1984.txt',
        '2018': 'photoDescriptions\\kenna\\2018.txt',
    },

    'library': {
        '1958': 'photoDescriptions\\library\\1958.txt',
        '1978': 'photoDescriptions\\library\\1978.txt',
        '2013': 'photoDescriptions\\library\\2013.txt',
    },

    'mago': {
        '1972': 'photoDescriptions\\mago\\1972.txt',
        '1973': 'photoDescriptions\\mago\\1973.txt',
        '1969': 'photoDescriptions\\mago\\1969.txt',
    },

    'mehling': {
        '1964': 'photoDescriptions\\mehling\\1964.txt',
        '1996': 'photoDescriptions\\mehling\\1996.txt',
        '2014': 'photoDescriptions\\mehling\\2014.txt',
    },

    'shiley': {
        '1948': 'photoDescriptions\\shiley\\1948.txt',
        '1969': 'photoDescriptions\\shiley\\1969.txt',
        '2009': 'photoDescriptions\\shiley\\2009.txt',
    },
    'waldschmidt': {
        '1892': 'photoDescriptions\\waldschmidt\\1892.txt',
        '1958': 'photoDescriptions\\waldschmidt\\1958.txt',
        '1975': 'photoDescriptions\\waldschmidt\\1975.txt',
        '1992': 'photoDescriptions\\waldschmidt\\1992.txt',
        '2021': 'photoDescriptions\\waldschmidt\\2021.txt',
    }

};

//keeps track of selected location button selected
var currentBuilding = "shiley"

//functions for timeline 

//when location button is selected updates screen and timeline info to match
function selectedBuilding(building) {
    currentBuilding = building
    document.getElementById("phone-container2").style.display = 'none';
    document.getElementById("phone-container3").style.display = 'flex';
    updateYear(building, null)
    //updates building name
    document.getElementById('buildingText').innerText = document.getElementById(building).innerText

}

//determines year of next event/timeline if possible, 
//building for hashmap and forward boolean for future(true) or past(false) in timeline
function updateYear(building, forward) {
    const years = Object.keys(descriptionPaths[building]);
    years.sort()

    //if not going forwards or backwards, default is most recent year
    if (forward == null) {
        updateInfo(building, years[years.length - 1])
        return
    }

    let currentYear = document.getElementById('yearText').innerText
    let currentIndex = years.indexOf(currentYear)
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

}

//updates all of the relevant texts and images to new event 
function updateInfo(building, year) {
    //updates image to new current year, only if year changes to avoid flashing/needless update
    if (year != document.getElementById('yearText').innerText) {
        const imagePath = "archiveContent\\" + building + "\\" + year + ".jpg"
        document.getElementById("buildingImage").setAttribute("src", imagePath)
    }

    //updates year to the new current year
    document.getElementById('yearText').innerText = year

    //updates description text to current year
    fetch(descriptionPaths[building][year])
        .then((response) => response.text())
        .then((text) => {
            //depending on if user selected to read more updates length of description text accordingly
            if (document.getElementById('read-button').innerText == "Read more") {
                document.getElementById('descriptionText').innerText = text.slice(0, 95) + "...";
            } else {
                document.getElementById('descriptionText').innerText = text;
            }
        });
}

function toHomeScreen() {
    document.getElementById("phone-container").style.display = 'flex';
    document.getElementById("phone-container1").style.display = 'none';
    document.getElementById("phone-container2").style.display = 'none';
    document.getElementById("phone-container3").style.display = 'none';
}




//buttons on clicks

//toggles menu drop down
document.getElementById("menu-button").onclick = function () {
    document.getElementById("myDropdown").classList.toggle("show")
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

    //$("#dots").toggle();
    //$("#toggle-text").toggle();
    updateInfo(currentBuilding, document.getElementById('yearText').innerText)
};



document.addEventListener("DOMContentLoaded", () => {
    updateInfo(currentBuilding, '2009');
});
