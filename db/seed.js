import { getDb } from "./db.js";
import { heroes } from "../data/heroes.js";

const db = await getDb();

await db.exec("BEGIN");
try {
  for (const h of heroes) {
    await db.run(
      `INSERT OR REPLACE INTO heroes (id, name, attackPower, defensePower, maxHp, imageUrl)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [h.id, h.name, h.attackPower, h.defensePower, h.maxHp, h.imageUrl],
    );
  }
  await db.exec("COMMIT");
  console.log(`Seeded ${heroes.length} heroes.`);
} catch (err) {
  await db.exec("ROLLBACK");
  console.error("Seeding failed:", err);
  process.exitCode = 1;
}
await db.close();
