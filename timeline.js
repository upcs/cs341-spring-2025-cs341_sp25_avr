

    //setting variables for timeline
    const descriptionPaths = {
    'shiley': {
        '1948': 'photoDescriptions\\shiley\\1948.txt',
        '1969': 'photoDescriptions\\shiley\\1969.txt',
        '2009': 'photoDescriptions\\shiley\\2009.txt',
    },
    'waldschmidt': {
    // add paths here after i import the content
    },
    // add more buildings here...
    'christie': {
        '1911': 'photoDescriptions\\christie\\1911.txt',
        '1960': 'photoDescriptions\\christie\\1960.txt',
        '1978': 'photoDescriptions\\christie\\1978.txt',
        '2019': 'photoDescriptions\\christie\\2019.txt',
    }
};


//functions for timeline 

//determines year of next event/timeline if possible, 
//building for hashmap and forward boolean for future(true) or past(false) in timeline
function updateYear(building, forward) {

    const years = Object.keys(descriptionPaths[building]);
    years.sort()

    let currentYear = document.getElementById('yearText').innerText
    let currentIndex = years.indexOf(currentYear)
    //goes to future year if possible and going forward
    if (currentIndex + 1 < years.length && forward == true){
        currentIndex = currentIndex + 1
        currentYear = years[currentIndex]
        updateInfo(building, currentYear)
    }
       
    //goes to past year if possible and going backwards
    if (currentIndex > 0 && forward == false){
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
     if(currentIndex == years.length - 1) {
        document.getElementById("future-button").style = "color:gray;"
    }

}

//updates all of the relevant texts and images to new event 
function updateInfo(building, year) {
    //updates image to new current year, only if year changes to avoid flashing/needless update
    if(year != document.getElementById('yearText').innerText) {
    const imagePath = "archiveContent\\" + building + "\\" + year + ".jpg"
    document.getElementById("buildingImage").setAttribute("src" , imagePath)
    }

    //updates year to the new current year
    document.getElementById('yearText').innerText = year

    //updates description text to current year
    fetch(descriptionPaths[building][year])
    .then((response) => response.text())
    .then((text) => {
        //depending on if user selected to read more updates length of description text accordingly
        if( $('#read-button').text() == "Read more" ){
            document.getElementById('descriptionText').innerText = text.slice(0,95) + "...";
        } else {
             document.getElementById('descriptionText').innerText = text;
        }
    });
}




//buttons on clicks
$(document).ready(function(){ 

    $("#menu-button").click(function(){
    $("#myDropdown").toggle();

}); 



document.getElementById("home-toggle").onclick = function () {
    window.location.href = "index.html";
}; 

document.getElementById("map-toggle").onclick = function () {
    window.location.href = "geo.html";
}; 

document.getElementById("past-button").onclick = function () {
    updateYear(popupId.id.toString(), false)
}; 

document.getElementById("future-button").onclick = function () {
    updateYear(popupId.id.toString(), true)
};        
  
$("#read-button").click(function(){
    var text = $(this).text();

    if (text === 'Read more') {
        $(this).text('Read less');
    } else {
        $(this).text('Read more');
    }

    //$("#dots").toggle();
    //$("#toggle-text").toggle();
    updateInfo(popupId.id.toString(), document.getElementById('yearText').innerText)
});

}); 
