import { getDb } from "./db.js";

export async function getAllHeroes() {
  const db = await getDb();
  return db.all("SELECT * FROM heroes ORDER BY id");
}
