import express from "express";
import { sseController } from "../../controllers/SSE/sseController.js";

const router = express.Router();

router.get("/stream", sseController);

export default router;
