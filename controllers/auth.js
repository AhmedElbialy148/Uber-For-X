const { validationResult } = require("express-validator");
const Citizen = require("../models/citizen");
const Cop = require("../models/cop");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "aa5707139@gmail.com",
    pass: "rkeajavzfzbggfyp",
  },
});
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
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
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
    const doMatch = await bcrypt.compare(password, user.password);
    if (!doMatch) {
      req.flash("error", "Wrong Password!");
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
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
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
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

////////////////////////////////////////////////////////////////
// Reset Password///////////////////////////////////////////////
exports.getResetPage = (req, res, next) => {
  let message = req.flash("error");
  message.length > 0 ? (message = message[0]) : (message = null);
  let status = req.flash("status");
  status.length > 0 ? (status = status[0]) : (status = null);

  res.status(status || 200).render("reset-email", {
    errorMessage: message,
  });
};

exports.postResetEmail = async (req, res, next) => {
  try {
    const email = req.body.email;
    // 1) Check validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash("error", errors.array()[0].msg);
      req.flash("status", 422);
      return res.redirect("/reset");
    }
    // 2) Check email existance
    const citizen = await Citizen.findOne({ email: email });
    if (!citizen) {
      req.flash("error", "Invalid Email!");
      req.flash("status", 422);
      return res.redirect("/reset");
    }

    // 3) Create verification code
    let token;
    crypto.randomBytes(3, async (err, buffer) => {
      try {
        if (err) {
          throw new Error("Couldn't create a verification code");
        }
        token = buffer.toString("hex");

        // 4) Save token in citizen document in DB
        citizen.verifCode = token;
        await citizen.save();

        // 5) Send email with verification code
        let mailOptions = {
          from: "aa5707139@gmail.com",
          to: email,
          subject: "Verification Code",
          text: `Your verification Code is: ${token}`,
        };
        transporter.sendMail(mailOptions, function (err, info) {
          if (err) {
            throw new Error("Couldn't send an email. Please try again later.");
          } else {
            console.log("Email sent: ", info.response);
          }
        });

        //  6) Render reset-code page
        return res.redirect(`/reset/verification?email=${email}`);
      } catch (err) {
        throw err;
      }
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.getResetVerifPage = (req, res, next) => {
  const email = req.query.email;
  let message = req.flash("error");
  message.length > 0 ? (message = message[0]) : (message = null);
  let status = req.flash("status");
  status.length > 0 ? (status = status[0]) : (status = null);

  res.status(status || 200).render("reset-verif", {
    errorMessage: message,
    email: email,
  });
};

exports.postResetVerification = async (req, res, next) => {
  try {
    const verifCode = req.body.verifCode;
    const email = req.query.email;
    const citizen = await Citizen.findOne({ email: email });
    if (!citizen) {
      throw new Error("Citizen not found in DB.");
    }
    if (citizen.verifCode !== verifCode) {
      req.flash("error", "Wrong verification code!");
      req.flash("status", 422);
      return res.redirect(`/reset/verification?email=${email}`);
    }

    // redirect to change password page
    res.redirect(`/reset/newPassword?email=${email}&verifCode=${verifCode}`);
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.getResetNewPassword = async (req, res, next) => {
  try {
    const email = req.query.email;
    const verifCode = req.query.verifCode;
    // route protection
    const citizen = await Citizen.findOne({ email: email });
    if (!citizen) {
      throw new Error("Citizen not found in DB.");
    }
    if (citizen.verifCode !== verifCode) {
      req.flash("error", "Wrong verification code!");
      req.flash("status", 422);
      return res.redirect(`/reset/verification?email=${email}`);
    }

    // render page
    let message = req.flash("error");
    message.length > 0 ? (message = message[0]) : (message = null);
    let status = req.flash("status");
    status.length > 0 ? (status = status[0]) : (status = null);

    res.status(status || 200).render("reset-new-password", {
      errorMessage: message,
      email: email,
      verifCode: verifCode,
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.postResetNewPass = async (req, res, next) => {
  try {
    const email = req.query.email;
    const verifCode = req.query.verifCode;
    const newPassword = req.body.newPassword;
    // 1) Check validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash("error", errors.array()[0].msg);
      req.flash("status", 422);
      return res.redirect(
        `/reset/newPassword?email=${email}&verifCode=${verifCode}`
      );
    }

    // 2) fetch citizen from DB
    const citizen = await Citizen.findOne({ email: email });
    if (!citizen) {
      throw new Error("Citizen not found in DB.");
    }
    if (citizen.verifCode !== verifCode) {
      req.flash("error", "Wrong verification code!");
      req.flash("status", 422);
      return res.redirect(`/reset/verification?email=${email}`);
    }

    // 3) create hashed password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    // 4) Update citizen password and remove verifode
    citizen.password = hashedPassword;
    citizen.verifCode = "";
    await citizen.save();

    // 5) redirect to login page
    res.redirect("/");
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};
