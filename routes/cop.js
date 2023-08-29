const express = require("express");
const router = express.Router();

const copController = require("../controllers/cop");
const isAuth = require("../routes-protection/isAuth");

router.get("/:copId", isAuth, copController.getCopPage);

module.exports = router;
