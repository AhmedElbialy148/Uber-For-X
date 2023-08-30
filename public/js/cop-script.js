"use strict";
////////////////////////////////////////////
// Variables
const coordsInput = document.querySelector(".coordsInput");
const requestBackupContainer = document.querySelector(".request-backup");
const solveBtnContainer = document.querySelector(".solve-form");
const socket = io();
////////////////////////////////////////////
// Functions
let map;
let myMarker;
let ongoingReqMarker;
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
    myMarker = createPoliceIcon(coords[0], coords[1]);

    // Viewing all requests
    const allRequests = document.querySelectorAll(".request");
    allRequests.forEach((reqEl) => {
      const lat = +reqEl.querySelector(".lat").value;
      const long = +reqEl.querySelector(".long").value;
      const userId = reqEl.querySelector(".userId").value;
      const requestId = reqEl.querySelector(".requestId").value;
      let ongoingReqId = JSON.parse(localStorage.getItem("ongoingRequestId"));

      if (ongoingReqId === requestId) {
        ongoingReqMarker = L.marker([lat, long])
          .addTo(map)
          .bindPopup(`Target`)
          .openPopup();
      } else {
        L.marker([lat, long])
          .addTo(map)
          .bindPopup(
            `Call for Help!<br><button class="request-btn" data-requestId="${requestId}" style="color:white;background-color:green;">Accept</button>`
          );
      }
    });

    // Viewing all other cops
    const otherCops = document.querySelectorAll(".other-cop");
    otherCops.forEach((copEl) => {
      const lat = +copEl.querySelector(".lat").value;
      const long = +copEl.querySelector(".long").value;
      const name = copEl.querySelector(".name").value;
      const copId = copEl.querySelector(".copId").value;
      createPoliceIcon(lat, long, name, copId);
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
      // console.log(savedLocation);
      if (coords[0] !== savedLocation[0] || coords[1] !== savedLocation[1]) {
        socketUpdateCopCoords(coords);
        localStorage.setItem("location", JSON.stringify(coords));
        map.removeLayer(myMarker);
        myMarker = createPoliceIcon(coords[0], coords[1]);
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

let acceptedReqPopupEl;
// Accepting help requests
document.querySelector("#map").addEventListener("click", (e) => {
  if (e.target.classList.contains("request-btn")) {
    const requestId = e.target.getAttribute("data-requestId");
    const copId = document.body.getAttribute("data-copId");
    const coords = JSON.parse(localStorage.getItem("location"));
    acceptedReqPopupEl = e.target.closest(".leaflet-popup-content");
    socket.emit("accept-request", {
      requestId: requestId,
      copId: copId,
      copCoords: coords,
    });
  }
});

socket.on("cop-request-updates", (data) => {
  // data={copId:'..',citizenData:{}, requestId:'..'} or data={copId:'..', errorMessage:".."}
  const copId = document.body.getAttribute("data-copId");
  if (data.copId === copId) {
    // check if cop is rejected
    if (data.errorMessage) {
      const errorMessageEl = document.querySelector(".errorMessage");
      return (errorMessageEl.textContent = data.errorMessage);
    }
    localStorage.setItem("ongoingRequestId", JSON.stringify(data.requestId));
    acceptedReqPopupEl.textContent = "Target";
    acceptedReqPopupEl.style.width = "51px";
    // Viewing request backup details
    let html = `
        <h1 class="req-backup-header owner-header">Citizen Info:<h1>
        <p>Citizen name: ${data.citizenData.userName}</p>
        <p>Citizen phone: ${data.citizenData.phoneNumber}</p>
        `;
    requestBackupContainer.textContent = "";
    requestBackupContainer.insertAdjacentHTML("afterbegin", html);

    // Viewing solve btn
    html = `
    <form method="post" action='/cop/${copId}/solved'>
        <input hidden type="text" name="requestId" value="${data.requestId}">
        <button type="submit" class="reset-btn solved-btn">Solved</button>
    </form>
    `;
    solveBtnContainer.textContent = "";
    solveBtnContainer.insertAdjacentHTML("afterbegin", html);
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
////////////////////////////////////////////////////
// Functions
function createPoliceIcon(lat, long, copName, copId) {
  //creating a cutomized police-car marker
  let iconOptions = {
    iconUrl: "/images/cop-icon.png",
    iconSize: [50, 50],
    iconAnchor: [50, 50],
    popupAnchor: [0, -45],
  };
  let customIcon = L.icon(iconOptions);
  let markerOptions = {
    clickable: true,
    draggable: false,
    icon: customIcon,
  };
  if (!copName || !copId) {
    return L.marker([lat, long], markerOptions)
      .addTo(map)
      .bindPopup("My Location");
  }
  return L.marker([lat, long], markerOptions)
    .addTo(map)
    .bindPopup(`Cop ID: ${copId} <br> Cop Name: ${copName}`);
}
