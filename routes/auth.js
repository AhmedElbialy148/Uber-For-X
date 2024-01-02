const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth");

const { body } = require("express-validator");

router.get("/", (req, res, next) => {
  res.redirect("/login");
});

//////////////////////////////////////////////////////////////
// Signup Citizen ////////////////////////////////////////////
router.get("/signup", authController.getSignupCitizen);

router.post(
  "/signup/citizen",
  body("email", "Please enter a valid email.").isEmail(),
  body("phoneNumber", "Please enter a valid phone Number.").isMobilePhone(),
  body("password", "Please enter a password with text and numbers only.")
    .trim()
    .isLength({ min: 5 })
    .isAlphanumeric(),
  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("Passwords have to match.");
    }
    return true;
  }),
  authController.postSignupCitizen
);

//////////////////////////////////////////////////////////////
// Login Citizen ////////////////////////////////////////////
router.get("/login", authController.getLoginCitizen);

router.post(
  "/login/citizen",
  body("email", "Please enter a valid email.").isEmail(),
  body("password", "Please enter a password with text and numbers only.")
    .trim()
    .isLength({ min: 5 })
    .isAlphanumeric(),
  authController.postLoginCitizen
);

//////////////////////////////////////////////////////////////
// Reset Citizen ////////////////////////////////////////////
router.get("/reset", authController.getResetPage);
router.get("/reset/verification", authController.getResetVerifPage);
router.get("/reset/newPassword", authController.getResetNewPassword);

router.post(
  "/reset",
  body("email", "Please enter a valid email.").isEmail(),
  authController.postResetEmail
);

router.post("/reset/verification", authController.postResetVerification);
router.post(
  "/reset/newPassword",
  body("newPassword", "Please enter a password with text and numbers only.")
    .trim()
    .isLength({ min: 5 })
    .isAlphanumeric(),
  body("confirmNewPassword").custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error("Passwords have to match.");
    }
    return true;
  }),
  authController.postResetNewPass
);
//////////////////////////////////////////////////////////////
// Login Cop ////////////////////////////////////////////
router.get("/login/cop", authController.getLoginCop);

router.post("/login/cop", authController.postLoginCop);

module.exports = router;
