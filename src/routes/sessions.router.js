import { Router } from "express";
import { login, register, current, logout } from "../controllers/session.controller.js";
import { authenticateCurrent } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/current", authenticateCurrent, current);
router.post("/logout", logout);

export default router;
