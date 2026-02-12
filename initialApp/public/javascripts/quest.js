const buildings = [
 "shiley","waldschmidt","chiles","christie","commons",
 "library","kenna","lund","beauchamp","buckley"
];

// fake coordinates — replace with yours from geo.js
const coords = {
 shiley:[45.572, -122.728],
 waldschmidt:[45.571, -122.729],
 chiles:[45.573, -122.730],
 christie:[45.574, -122.727],
 commons:[45.570, -122.726],
 library:[45.5725,-122.7265],
 kenna:[45.5715,-122.7275],
 lund:[45.573,-122.728],
 beauchamp:[45.569,-122.729],
 buckley:[45.570,-122.730]
};

const saved = JSON.parse(localStorage.getItem("questStamps")||"{}");

function goHome(){
 window.location.href="/";
}

function initDropdown(){
 const sel=document.getElementById("buildingSelect");
 buildings.forEach(b=>{
  const o=document.createElement("option");
  o.value=b;
  o.textContent=b;
  sel.appendChild(o);
 });
}

function drawStamps(){
 const grid=document.getElementById("stampGrid");
 grid.innerHTML="";
 buildings.forEach(b=>{
  const d=document.createElement("div");
  d.className="stamp"+(saved[b]?" earned":"");
  d.innerText=b;
  grid.appendChild(d);
 });
}

function earnStamp(){
 const b=document.getElementById("buildingSelect").value;
 const text=document.getElementById("likeText").value.trim();

 if(!text){
  alert("Write what you like first");
  return;
 }

 saved[b]=true;
 localStorage.setItem("questStamps",JSON.stringify(saved));

 confetti({particleCount:80,spread:60});
 drawStamps();
}

function initMap(){
 const map=L.map("questMap").setView(coords.shiley,16);

 L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

 let path=[];

 buildings.forEach(b=>{
  L.marker(coords[b]).addTo(map).bindPopup(b);
  path.push(coords[b]);
 });

 // draw path line
 L.polyline(path,{weight:5}).addTo(map);
}

initDropdown();
drawStamps();
initMap();
