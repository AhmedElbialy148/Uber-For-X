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
    L.marker(coords).addTo(map);
    // coordsInput.value = latitude + " " + longitude;

    // View cop icon if request is being investigating
    if (requestBackupContainer.querySelector(".copCoords")) {
      const copCoords = requestBackupContainer
        .querySelector(".copCoords")
        .value.split(" ");
      createPoliceIcon(+copCoords[0], +copCoords[1]);
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
        localStorage.removeItem("location");
        location.reload();
      }
    },
    (err) => {
      alert("Couldn't get your location.");
    }
  );
}, 2000);

////////////////////////////////////////////////
// Socket.io events

requestBtn.addEventListener("click", () => {
  // ["lat","long"]
  const coords = JSON.parse(localStorage.getItem("location"));
  console.log(coords);
  if (!requestBackupContainer.querySelector("h1")) {
    const html = `<h1 class="req-backup-header">Requesting help...</h1>`;
    requestBackupContainer.insertAdjacentHTML("afterbegin", html);
  }

  socket.emit("request-for-help", {
    coords: coords,
    userId: document.body.getAttribute("data-userId"),
  });
});

socket.on("citizen-request-updates", (data) => {
  // data= {userId:'..', copData:{}, copCoords:[]}
  const userId = document.body.getAttribute("data-userId");

  if (data.userId === userId) {
    console.log(data.copData.copId, " is on the way");
    // Viewing request backup details
    console.log(data.copData);
    const html = `
        <h1 class="req-backup-header">Help is on the way<h1>
        <p>Cop name: ${data.copData.displayName}</p>
        <p>Cop Phone: ${data.copData.phone}</p>
        <p>Cop Earned Ratings: ${data.copData.earnedRatings}</p>
        <p>Cop Total Ratings: ${data.copData.totalRatings}</p>
        `;
    requestBackupContainer.textContent = "";
    requestBackupContainer.insertAdjacentHTML("afterbegin", html);
    //creating a cutomized police-car marker
    createPoliceIcon(data.copCoords[0], data.copCoords[1]);
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
