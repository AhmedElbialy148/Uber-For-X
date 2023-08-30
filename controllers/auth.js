const { validationResult } = require("express-validator");
const Citizen = require("../models/citizen");
const Cop = require("../models/cop");
const bcrypt = require("bcrypt");

////////////////////////////////////////////////////////////////
// Signup citizen/////////////////////////////////////////////
exports.getSignupCitizen = (req, res, next) => {
  let message = req.flash("error");
  message.length > 0 ? (message = message[0]) : (message = null);
  let status = req.flash("status");
  status.length > 0 ? (status = status[0]) : (status = null);
  res.status(status || 200).render("form", {
    job: "citizen",
    state: "signup",
    errorMessage: message,
  });
};

exports.postSignupCitizen = async (req, res, next) => {
  try {
    const userName = req.body.userName;
    const email = req.body.email;
    const password = req.body.password;
    const phoneNumber = req.body.phoneNumber;
    // ["lat","long"]
    const coords = req.body.coords.split(" ");
    // 1) Check validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash("error", errors.array()[0].msg);
      req.flash("status", 422);
      return res.redirect("/signup");
    }
    // 2) Check for existing email
    const citizen = await Citizen.findOne({ email: email });
    if (citizen) {
      req.flash("error", "E-mail exists already,Please pick a different one");
      req.flash("status", 422);
      return res.redirect("/signup");
    }

    // 3) create hashed password
    const hashedPassword = await bcrypt.hash(password, 12);

    // 4) Create new user
    const response = await Citizen.insertMany([
      {
        userName: userName,
        phoneNumber: phoneNumber,
        email: email,
        password: hashedPassword,
        location: {
          coordinates: [+coords[0], +coords[1]],
        },
      },
    ]);

    //  4) Redirect to login page
    return res.redirect("/login");
  } catch (err) {
    console.log(err);
  }
};

////////////////////////////////////////////////////////////////
// Login Citizen/////////////////////////////////////////////
exports.getLoginCitizen = (req, res, next) => {
  let message = req.flash("error");
  message.length > 0 ? (message = message[0]) : (message = null);
  let status = req.flash("status");
  status.length > 0 ? (status = status[0]) : (status = null);

  res.status(status || 200).render("form", {
    job: "citizen",
    state: "login",
    errorMessage: message,
  });
};

exports.postLoginCitizen = async (req, res, next) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    // ["lat","long"]
    const coords = req.body.coords.split(" ");

    // 1) Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash("error", errors.array()[0].msg);
      req.flash("status", 422);
      return res.redirect("/login");
    }

    // 2) Check existing email
    const user = await Citizen.findOne({ email: email });
    if (!user) {
      req.flash("error", "Invalid email!");
      req.flash("status", 422);
      return res.redirect("/login");
    }

    //   3) Check right password
    const doMatch = bcrypt.compare(user.password, password);
    if (!doMatch) {
      req.flash("error", "Invalid Password!");
      req.flash("status", 422);
      return res.redirect("/login");
    }

    // 4) Update location coords in DB
    user.location.coordinates = [+coords[1], +coords[0]];
    await user.save();

    //   5) Confirm Authentication
    req.session.isLoggedIn = true;
    req.session.user = {
      job: "citizen",
      userId: user._id.toString(),
    };
    await req.session.save();
    return res.redirect(`/citizen/${user._id.toString()}`);
  } catch (err) {
    console.log(err);
  }
};

////////////////////////////////////////////////////////////////
// Login Cop///////////////////////////////////////////////
exports.getLoginCop = (req, res, next) => {
  let message = req.flash("error");
  message.length > 0 ? (message = message[0]) : (message = null);
  let status = req.flash("status");
  status.length > 0 ? (status = status[0]) : (status = null);

  res.status(status || 200).render("form", {
    job: "cop",
    state: "login",
    errorMessage: message,
  });
};

exports.postLoginCop = async (req, res, next) => {
  try {
    const copId = req.body.copId.trim();
    const coords = req.body.coords.split(" ");
    const lat = +coords[0];
    const long = +coords[1];
    // 1) Check existing ID
    const cop = await Cop.findOne({ copId: copId });
    if (!cop) {
      req.flash("error", "Invalid Cop ID!");
      req.flash("status", 422);
      return res.redirect("/login/cop");
    }

    // 2) Confirm Authentication
    req.session.isLoggedIn = true;
    req.session.user = {
      job: "cop",
      userId: cop._id.toString(),
    };
    await req.session.save();

    // 3) Update cop coords
    cop.location.coordinates = [lat, long];
    await cop.save();
    return res.redirect(`/cop/${copId}`);
  } catch (err) {
    console.log(err);
  }
};
