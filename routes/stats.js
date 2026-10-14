import { Router } from "express";
import { getUserStats } from "../db/runs.js";

const router = Router();

router.get("/", async (req, res) => {
  if (!req.session.userId) {
    return res
      .status(401)
      .json({ error: "Please sign in to view your stats." });
  }
  try {
    res.json(await getUserStats(req.session.userId));
  } catch (err) {
    console.error("stats failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
