const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Cop = require("../models/cop");
const Citizen = require("../models/citizen");
const Request = require("../models/request");

exports.getCopPage = async (req, res, next) => {
  try {
    // req.user={job:'cop' , userId='.....'}
    const copId = req.params.copId;
    const cop = await Cop.findOne({ _id: new ObjectId(req.user.userId) });
    const allRequests = await Request.find();

    let exist = false,
      header = "",
      citizenName = "",
      citizenPhone = "";

    const request = await Request.findOne({ copId: copId });
    if (request) {
      exist = true;
      const citizen = await Citizen.findById(request.userId);
      header = "Citizen Info:";
      citizenName = citizen.userName;

      // citizenPhone = citizen.phone
    }
    res.render("cop", {
      copId: cop.copId,
      name: cop.displayName,
      phone: cop.phone,
      email: cop.email,
      earnedRatings: cop.earnedRatings,
      totalRatings: cop.totalRatings,
      allRequests: allRequests,
      reqBackup: {
        exist: exist,
        header: header,
        citizenName: citizenName,
        // citizenPhone:citizenPhone
      },
    });
  } catch (err) {}
};
