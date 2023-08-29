const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Cop = require("../models/cop");
const Citizen = require("../models/citizen");
const Request = require("../models/request");
const io = require("./socket");

module.exports = (socket) => {
  socket.on("request-for-help", async (data) => {
    try {
      // data={coords:[], userId:'..'}
      let request = await Request.findOne({
        userId: new ObjectId(data.userId),
      });
      if (request) {
        return null;
      }
      request = await Request.insertMany([
        {
          userId: new ObjectId(data.userId),
          location: {
            coordinates: data.coords,
          },
        },
      ]);

      io.getIO().emit("new-cop-request", {
        requestId: request[0]._id.toString(),
        location: {
          coordinates: data.coords,
        },
      });
    } catch (err) {
      console.log(err);
    }
  });

  socket.on("accept-request", async (data) => {
    try {
      // data={requestId:'...' , copId:'...', copCoords:[lat,long]}
      const request = await Request.findById(data.requestId);
      if (!request) throw new Error("Help request was not found in DB.");

      const cop = await Cop.findOne({ copId: data.copId });
      if (!request) throw new Error("Cop was not found in DB.");
      // Update cop status in DB
      cop.copStatus = "investigating";
      await cop.save();
      // Update request in DB
      request.copId = data.copId;
      request.reqStatus = "investigating";
      await request.save();

      // Inform citizen with news
      io.getIO().emit("citizen-request-updates", {
        userId: request.userId,
        copData: cop,
        copCoords: data.copCoords,
      });

      // Inform cop with citizen details
      const citizen = await Citizen.findById(request.userId);
      if (!request) throw new Error("Citizen was not found in DB.");
      io.getIO().emit("cop-request-updates", {
        copId: data.copId,
        citizenData: citizen,
      });
    } catch (err) {
      console.log("My error: ", err);
    }
  });

  socket.on("update-cop-coords", async (data) => {
    try {
      // data={copId:'..', coords:[]}
      await Cop.updateOne(
        { copId: data.copId },
        { $set: { "location.coordinates": data.coords } }
      );
    } catch (err) {
      console.log("My error: ", err);
    }
  });

  socket.on("update-citizen-coords", async (data) => {
    try {
      // data={userId:'..', coords:[]}
      await Citizen.updateOne(
        { _id: new ObjectId(data.userId) },
        { $set: { "location.coordinates": data.coords } }
      );
      const request = await Request.findOne({
        userId: new ObjectId(data.userId),
      });
      if (request) {
        request.location.coordinates = data.coords;
        await request.save();
      }
    } catch (err) {
      console.log("My error: ", err);
    }
  });
};
