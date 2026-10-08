import { Router } from "express";
import { createEvent, getEvents, getEventById, updateEvent, changeEventStatus } from "../controllers/event.controller.js";
import { authenticateJWT, authorizeRoles } from "../middleware/auth.middleware.js";

const router = Router();
const manage = [authenticateJWT, authorizeRoles("organizer", "admin")];

router.get("/", getEvents);
router.get("/:id", getEventById);
router.post("/", ...manage, createEvent);
router.put("/:id", ...manage, updateEvent);
router.patch("/:id/status", ...manage, changeEventStatus);

export default router;
