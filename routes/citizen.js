const express = require("express");
const router = express.Router();

const citizenController = require("../controllers/citizen");
const isAuth = require("../routes-protection/isAuth");

router.get("/:userId", isAuth, citizenController.getCitizinPage);

module.exports = router;
