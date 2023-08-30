const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Cop = require("../models/cop");
const Citizen = require("../models/citizen");
const Request = require("../models/request");
const io = require("../socket/socket");

exports.getCopPage = async (req, res, next) => {
  try {
    // req.user={job:'cop' , userId='.....'}
    const copId = req.params.copId;
    const cop = await Cop.findOne({ copId: copId });
    // get all available help requests
    const allRequests = await Request.find();

    // get all other cops locations
    const otherCops = await Cop.find(
      { copId: { $ne: copId } },
      { displayName: 1, "location.coordinates": 1, copId: 1, _id: 0 }
    );
    // console.log(otherCops);

    let exist = false,
      header = "",
      citizenName = "",
      citizenPhone = "",
      requestId = "";

    const request = await Request.findOne({ copId: copId });
    if (request) {
      exist = true;
      requestId = request._id.toString();
      const citizen = await Citizen.findById(request.userId);
      header = "Citizen Info:";
      citizenName = citizen.userName;
      citizenPhone = citizen.phoneNumber;
    }

    res.render("cop", {
      copId: cop.copId,
      name: cop.displayName,
      phone: cop.phone,
      email: cop.email,
      earnedRatings: cop.earnedRatings,
      totalRatings: cop.totalRatings,
      allRequests: allRequests,
      otherCops: otherCops,
      reqBackup: {
        exist: exist,
        header: header,
        citizenName: citizenName,
        citizenPhone: citizenPhone,
        requestId: requestId,
      },
    });
  } catch (err) {
    console.log("My error: ", err);
  }
};

exports.postSolvedReq = async (req, res, next) => {
  try {
    const copId = req.params.copId;
    const requestId = req.body.requestId;

    const request = await Request.findById(requestId);
    if (!request) {
      throw new Error("Request is not found in DB");
    }
    if (request.copId !== copId || request._id.toString() !== requestId) {
      throw new Error("Not your request to solve idiot!");
    }

    const citizenId = request.userId;
    await Request.deleteOne({ _id: new ObjectId(requestId) });
    // Update cop document and view page
    const cop = await Cop.findOneAndUpdate(
      { copId: copId },
      {
        $set: { copStatus: "on-duty" },
        $inc: { earnedRatings: 1, totalRatings: 1 },
      }
    );

    // Update citizen view page
    io.getIO().emit("citizen-solve-request", {
      solved: true,
    });
    return res.redirect(`/cop/${copId}`);
  } catch (err) {
    console.log("My error: ", err);
  }
};
