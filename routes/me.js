import { Router } from "express";
import { findUserById } from "../db/users.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    if (!req.session.userId) return res.json({ isLoggedIn: false });

    const user = await findUserById(req.session.userId);
    if (!user) return res.json({ isLoggedIn: false });

    res.json({ isLoggedIn: true, name: user.name });
  } catch (err) {
    console.error("me failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
