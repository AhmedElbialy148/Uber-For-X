"use strict";
////////////////////////////////////////////
// Variables
const coordsInput = document.querySelector(".coordsInput");
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
    let marker = L.marker(coords, markerOptions).addTo(map);

    // Viewing all requests
    const allRequests = document.querySelectorAll(".request");
    allRequests.forEach((reqEl) => {
      const lat = +reqEl.querySelector(".lat").value;
      const long = +reqEl.querySelector(".long").value;
      const userId = reqEl.querySelector(".userId").value;
      const requestId = reqEl.querySelector(".requestId").value;
      L.marker([lat, long])
        .addTo(map)
        .bindPopup(
          `Call for Help!<br><button class="request-btn" data-requestId="${requestId}" style="color:white;background-color:green;">Accept</button>`
        );
    });

    coordsInput.value = latitude + " " + longitude;
  },
  (err) => {
    alert("Couldn't get your location.");
  }
);

// Ckecking for changes in police car location
const timeInterval = setInterval(() => {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      const coords = [latitude, longitude];
      const savedLocation = JSON.parse(localStorage.getItem("location"));
      if (coords[0] !== savedLocation[0] || coords[1] !== savedLocation[1]) {
        socketUpdateCopCoords(coords);
        localStorage.removeItem("location");
        location.reload();
      }
    },
    (err) => {
      alert("Couldn't get your location.");
    }
  );
}, 2000);

// Socket.io events ////////////////////////
// Listening to help requests
socket.on("new-cop-request", (data) => {
  console.log("new request:", data);
  L.marker([30.0082903, 31.1384729])
    .addTo(map)
    .bindPopup(
      `Call for Help!<br><button class="request-btn" data-requestId="${data.requestId}" style="color:white;background-color:green;">Accept</button>`
    );
});

// Accepting help requests
document.querySelector("#map").addEventListener("click", (e) => {
  if (e.target.classList.contains("request-btn")) {
    const requestId = e.target.getAttribute("data-requestId");
    const copId = document.body.getAttribute("data-copId");
    const coords = JSON.parse(localStorage.getItem("location"));
    socket.emit("accept-request", {
      requestId: requestId,
      copId: copId,
      copCoords: coords,
    });
  }
});

// Updating Cop coords
function socketUpdateCopCoords(coords) {
  const copId = document.body.getAttribute("data-copId");
  socket.emit("update-cop-coords", {
    copId: copId,
    coords: coords,
  });
}

socket.on("cop-request-updates", (data) => {
  // data={copId:'',citizenData:{}}
  const copId = document.body.getAttribute("data-copId");
  if (data.copId === copId) {
    // Viewing request backup details
    const html = `
        <h1 class="req-backup-header">Citizen Info:<h1>
        <p>Citizen name: ${data.citizenData.userName}</p>
        <p>Citizen phone: </p>
        `;
    // <p>Citizen Phone: ${data.citizenData.phone}</p>
    requestBackupContainer.textContent = "";
    requestBackupContainer.insertAdjacentHTML("afterbegin", html);
  }
});
