const Citizen = require("../models/citizen");
const Cop = require("../models/cop");
const Request = require("../models/request");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const io = require("../socket/socket");
const cop = require("../models/cop");
// const ObjectId = mongoose.ObjectId;

exports.getCitizinPage = async (req, res, next) => {
  const userId = req.params.userId;
  const citizen = await Citizen.findOne({});

  const request = await Request.findOne({ userId: new ObjectId(userId) });
  let exist = false,
    header = "",
    copName = "",
    copPhone = "",
    copId = "",
    copEarnedRatings = "",
    copTotalRatings = "",
    state = "",
    copCoords = [];

  if (request) {
    exist = true;
    if (request.reqStatus === "suspended") {
      header = "Requesting help...";
      state = "suspended";
      // header = `<h1 class="req-backup-header">Requesting help...</h1>`;
    } else {
      const cop = await Cop.findOne({ copId: request.copId });
      if (!cop) throw new Error();
      state = "investigating";
      header = "Help is on the way";
      copName = cop.displayName;
      copId = cop.copId;
      copPhone = cop.phone;
      copEarnedRatings = cop.earnedRatings;
      copTotalRatings = cop.totalRatings;
      copCoords = cop.location.coordinates.join(" ");
    }
  }
  res.render("citizen", {
    name: citizen.userName,
    phone: citizen.phoneNumber,
    email: citizen.email,
    userId: userId,
    reqBackup: {
      exist: exist,
      state: state,
      header: header,
      copName: copName,
      copPhone: copPhone,
      copEarnedRatings: copEarnedRatings,
      copTotalRatings: copTotalRatings,
      copCoords: copCoords,
    },
  });
};

// exports.postCitizenHelp = async (req, res, next) => {
//   let coords = req.body.coords.split(" "); //["lat","long"]
//   let latitude = +coords[0];
//   let longitude = +coords[1];
//   const userId = req.user.userId;
//   const user = await Citizen.findById(userId);
//   io.getIO().emit("request-for-help", {
//     name: user.userName,
//     coords: [latitude, longitude],
//   });
// };
