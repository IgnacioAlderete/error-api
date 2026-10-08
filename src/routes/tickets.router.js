import { Router } from "express";
import { createTicket, getMyTickets, getEventTickets, cancelTicket } from "../controllers/ticket.controller.js";
import { authenticateJWT, authorizeRoles } from "../middleware/auth.middleware.js";

// Montar en /api  ->  /api/tickets, /api/tickets/my-tickets, /api/events/:eid/tickets, /api/tickets/:tid/cancel
const router = Router();

router.post("/tickets", authenticateJWT, authorizeRoles("user", "organizer", "admin"), createTicket);
router.get("/tickets/my-tickets", authenticateJWT, getMyTickets);
router.get("/events/:eid/tickets", authenticateJWT, authorizeRoles("organizer", "admin"), getEventTickets);
router.patch("/tickets/:tid/cancel", authenticateJWT, cancelTicket);

export default router;
