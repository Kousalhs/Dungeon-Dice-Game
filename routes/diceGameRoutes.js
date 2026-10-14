import { Router } from "express";
import { createDiceGameEngine } from "../domain/diceGameEngine.js";
import { getAllHeroes } from "../db/heroes.js";
import { createRun, updateRunStats } from "../db/runs.js";

const router = Router();

const GUEST_USER_ID = 1;

const heroes = await getAllHeroes();
const engine = createDiceGameEngine(heroes);

function currentUserId(req) {
  return req.session.userId || GUEST_USER_ID;
}

// Create a run for this session if there isn't one yet.
async function ensureRun(req) {
  if (!req.session.runId) {
    req.session.runId = await createRun(currentUserId(req));
  }
  return req.session.runId;
}

// The only place that touches updateRunStats, so it's easy to adjust.
async function recordResult(runId, outcome) {
  await updateRunStats(runId, outcome);
}

router.get("/heroes", (req, res) => {
  res.json({ heroes: engine.getHeroes() });
});

router.post("/battle/start", async (req, res) => {
  try {
    const { heroId } = req.body || {};
    const result = engine.startBattle(heroId);

    if (result.error) {
      return res.status(400).json({ message: result.error });
    }

    await ensureRun(req);

    res.json({ ...result, message: "Battle started. Roll to attack!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/battle/round", async (req, res) => {
  try {
    const result = engine.playRound();

    if (result.error) {
      return res.status(400).json({ message: result.error });
    }

    if (result.outcome !== "ongoing") {
      const runId = await ensureRun(req);
      await recordResult(runId, result.outcome);
    }

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/battle/reset", (req, res) => {
  engine.resetBattle();
  res.json({ message: "Battle reset." });
});

export default router;
