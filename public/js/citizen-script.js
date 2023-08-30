"use strict";
////////////////////////////////////////////
// Variables
// const coordsInput = document.querySelector(".coordsInput");
const requestBtn = document.querySelector(".request-btn");
const requestBackupContainer = document.querySelector(".request-backup");
const socket = io();
////////////////////////////////////////////
// Functions
let map;
let myMarker;
navigator.geolocation.getCurrentPosition(
  (position) => {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    let coords = [latitude, longitude];
    localStorage.setItem("location", JSON.stringify(coords));
    //Leaflet library for map
    map = L.map("map").setView(coords, 15);
    L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    myMarker = L.marker(coords).addTo(map).bindPopup("My Location");
    // coordsInput.value = latitude + " " + longitude;

    // View cop icon if request is being investigating
    if (requestBackupContainer.querySelector(".copCoords")) {
      const copCoords = requestBackupContainer
        .querySelector(".copCoords")
        .value.split(" ");
      let copMarker = createPoliceIcon(+copCoords[0], +copCoords[1]);
      localStorage.setItem("cop-marker", JSON.stringify(copMarker));
    }
  },
  (err) => {
    alert("Couldn't get your location.");
  }
);

const timeInterval = setInterval(() => {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      const coords = [latitude, longitude];
      const savedLocation = JSON.parse(localStorage.getItem("location"));
      if (coords[0] !== savedLocation[0] || coords[1] !== savedLocation[1]) {
        socketUpdateCitizenCoords(coords);
        localStorage.setItem("location", JSON.stringify(coords));
        map.removeLayer(myMarker);
        myMarker = L.marker(coords).addTo(map);
      }
    },
    (err) => {
      alert("Couldn't get your location.");
    }
  );
}, 2000);

////////////////////////////////////////////////
// Socket.io events

// Requesting help
requestBtn.addEventListener("click", () => {
  // ["lat","long"]
  const coords = JSON.parse(localStorage.getItem("location"));
  if (!requestBackupContainer.querySelector("h1")) {
    const html = `<h1 class="req-backup-header">Requesting help...</h1>`;
    requestBackupContainer.insertAdjacentHTML("afterbegin", html);
  }

  socket.emit("request-for-help", {
    coords: coords,
    userId: document.body.getAttribute("data-userId"),
  });
});

//  Listening to request response
socket.on("citizen-request-updates", (data) => {
  // data= {userId:'..', copData:{}, copCoords:[]}
  const userId = document.body.getAttribute("data-userId");

  if (data.userId === userId) {
    console.log(data.copData.copId, " is on the way");
    // Viewing request backup details
    const html = `
        <h1 class="req-backup-header owner-header">Help is on the way<h1>
        <p>Cop name: ${data.copData.displayName}</p>
        <p>Cop Phone: ${data.copData.phone}</p>
        <p>Cop Earned Ratings: ${data.copData.earnedRatings}</p>
        <p>Cop Total Ratings: ${data.copData.totalRatings}</p>
        `;
    requestBackupContainer.textContent = "";
    requestBackupContainer.insertAdjacentHTML("afterbegin", html);
    //creating a cutomized police-car marker
    let copMarker = createPoliceIcon(data.copCoords[0], data.copCoords[1]);
  }
});

//  Updating request being solved
socket.on("citizen-solve-request", (data) => {
  // data={solved:true}
  if (data.solved === true) {
    location.reload();
  }
});

// Updating Citizen coords
function socketUpdateCitizenCoords(coords) {
  const userId = document.body.getAttribute("data-userId");
  socket.emit("update-citizen-coords", {
    userId: userId,
    coords: coords,
  });
}

////////////////////////////////////////////////////
// Functions
function createPoliceIcon(lat, long) {
  //creating a cutomized police-car marker
  let iconOptions = {
    iconUrl: "/images/cop-icon.png",
    iconSize: [50, 50],
    iconAnchor: [25, 50],
    popupAnchor: [0, -45],
  };
  let customIcon = L.icon(iconOptions);
  let markerOptions = {
    title: "MyLocation",
    clickable: true,
    draggable: false,
    icon: customIcon,
  };
  return L.marker([lat, long], markerOptions).addTo(map);
}
