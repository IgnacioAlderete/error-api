import { Router } from "express";
import { getMockUsers, getMockEvents, generateData } from "../controllers/mocks.controller.js";

const router = Router();

router.get("/users", getMockUsers);
router.get("/events", getMockEvents);
router.post("/generate", generateData);

export default router;
