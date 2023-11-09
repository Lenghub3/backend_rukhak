import express from "express";
import handleTextQuery from "../controller/DialogflowController.js";

const router = express.Router();

router.post("/textQuery",handleTextQuery);

export default router;
