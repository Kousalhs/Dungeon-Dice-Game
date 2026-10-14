import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "..", "database.db");

let dbPromise;

export function getDb() {
  if (!dbPromise) {
    dbPromise = open({ filename: DB_PATH, driver: sqlite3.Database }).then(
      async (db) => {
        await db.exec("PRAGMA foreign_keys = ON;");
        await createTables(db);
        return db;
      },
    );
  }
  return dbPromise;
}

async function createTables(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS heroes (
      id           INTEGER PRIMARY KEY,
      name         TEXT NOT NULL,
      attackPower  INTEGER NOT NULL,
      defensePower INTEGER NOT NULL,
      maxHp        INTEGER NOT NULL,
      imageUrl     TEXT
    );

    CREATE TABLE IF NOT EXISTS users (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL,
      username   TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password   TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS runs (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id       INTEGER NOT NULL,
      total_battles INTEGER NOT NULL DEFAULT 0,
      wins          INTEGER NOT NULL DEFAULT 0,
      losses        INTEGER NOT NULL DEFAULT 0,
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // Demo/guest user (id 1). Its password can never match a scrypt hash.
  await db.run(
    `INSERT OR IGNORE INTO users (id, name, username, password)
     VALUES (1, 'Guest', 'guest', '!')`,
  );
}
