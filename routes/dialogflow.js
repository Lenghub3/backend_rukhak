const express = require("express");
const router = express.Router();
const DialogflowController = require("../controller/DialogflowController");

router.post("/textQuery", DialogflowController.handleTextQuery);

module.exports = router;
