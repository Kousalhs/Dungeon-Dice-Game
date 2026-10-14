import { getDb } from "./db.js";

export async function findUserByUsername(username) {
  const db = await getDb();
  return db.get("SELECT * FROM users WHERE username = ?", [username]);
}

export async function findUserById(id) {
  const db = await getDb();
  return db.get("SELECT id, name, username FROM users WHERE id = ?", [id]);
}

export async function createUser(name, username, passwordHash) {
  const db = await getDb();
  const result = await db.run(
    "INSERT INTO users (name, username, password) VALUES (?, ?, ?)",
    [name, username, passwordHash],
  );
  return result.lastID;
}
