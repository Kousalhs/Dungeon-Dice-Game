import { getDb } from "./db.js";

let drawsColumnReady = null;

// Adds the draws column to existing databases (runs once per server start).
async function ensureDrawsColumn(db) {
  if (!drawsColumnReady) {
    drawsColumnReady = (async () => {
      const cols = await db.all("PRAGMA table_info(runs)");
      if (!cols.some((c) => c.name === "draws")) {
        await db.run(
          "ALTER TABLE runs ADD COLUMN draws INTEGER NOT NULL DEFAULT 0",
        );
        // Earlier draws were only counted in total_battles, so recover them.
        await db.run("UPDATE runs SET draws = total_battles - wins - losses");
      }
    })().catch((err) => {
      drawsColumnReady = null;
      throw err;
    });
  }
  return drawsColumnReady;
}

export async function createRun(userId) {
  const db = await getDb();
  await ensureDrawsColumn(db);
  const result = await db.run("INSERT INTO runs (user_id) VALUES (?)", [
    userId,
  ]);
  return result.lastID;
}

export async function updateRunStats(runId, outcome) {
  if (!runId || outcome === "ongoing") return;
  const db = await getDb();
  await ensureDrawsColumn(db);
  const win = outcome === "player_win" ? 1 : 0;
  const loss = outcome === "player_loss" ? 1 : 0;
  const draw = outcome === "draw" ? 1 : 0;
  await db.run(
    `UPDATE runs
     SET total_battles = total_battles + 1,
         wins = wins + ?,
         losses = losses + ?,
         draws = draws + ?
     WHERE id = ?`,
    [win, loss, draw, runId],
  );
}

// Used by the stretch story
export async function getUserStats(userId) {
  const db = await getDb();
  await ensureDrawsColumn(db);
  const totals = await db.get(
    `SELECT COUNT(*) AS totalRuns,
            COALESCE(SUM(total_battles), 0) AS totalBattles,
            COALESCE(SUM(wins), 0)          AS wins,
            COALESCE(SUM(losses), 0)        AS losses,
            COALESCE(SUM(draws), 0)         AS draws
     FROM runs WHERE user_id = ?`,
    [userId],
  );
  const bestRun = await db.get(
    `SELECT id, total_battles AS totalBattles, wins, losses, draws,
            created_at AS createdAt
     FROM runs
     WHERE user_id = ? AND total_battles > 0
     ORDER BY wins DESC, losses ASC, id ASC
     LIMIT 1`,
    [userId],
  );
  return { ...totals, bestRun: bestRun || null };
}
