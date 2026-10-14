import { Router } from "express";
import crypto from "node:crypto";
import { promisify } from "node:util";
import { createUser, findUserByUsername } from "../db/users.js";

const scrypt = promisify(crypto.scrypt);
const router = Router();
const USERNAME_RE = /^[a-zA-Z0-9_-]{1,20}$/;

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = (await scrypt(password, salt, 64)).toString("hex");
  return `${salt}:${hash}`;
}

async function verifyPassword(password, stored) {
  const [salt, hash] = String(stored).split(":");
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = await scrypt(password, salt, expected.length);
  return crypto.timingSafeEqual(actual, expected);
}

const clean = (v) => (typeof v === "string" ? v.trim() : "");

// New session id on login (prevents session fixation). This also drops any
// guest runId, so the user's first battle starts a fresh run under their own id.
function startSession(req, userId) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) return reject(err);
      req.session.userId = userId;
      req.session.save((err2) => (err2 ? reject(err2) : resolve()));
    });
  });
}

router.post("/register", async (req, res) => {
  try {
    const name = clean(req.body?.name);
    const username = clean(req.body?.username);
    const password =
      typeof req.body?.password === "string" ? req.body.password : "";

    if (!name || !username || !password.trim()) {
      return res.status(400).json({ error: "All fields are required." });
    }
    if (!USERNAME_RE.test(username)) {
      return res
        .status(400)
        .json({
          error:
            "Username must be 1–20 characters, using letters, numbers, _ or -.",
        });
    }
    if (await findUserByUsername(username)) {
      return res.status(400).json({ error: "Username already in use." });
    }

    const userId = await createUser(
      name,
      username,
      await hashPassword(password),
    );
    await startSession(req, userId);
    res.status(201).json({ message: "User registered" });
  } catch (err) {
    if (err.code === "SQLITE_CONSTRAINT") {
      return res.status(400).json({ error: "Username already in use." });
    }
    console.error("register failed:", err);
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const username = clean(req.body?.username);
    const password =
      typeof req.body?.password === "string" ? req.body.password : "";

    if (!username || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const user = await findUserByUsername(username);
    if (!user || !(await verifyPassword(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    await startSession(req, user.id);
    res.json({ message: "Logged in" });
  } catch (err) {
    console.error("login failed:", err);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

router.post("/logout", (req, res) => {
  // Destroying the session ends the current run (runId lives in the session)
  req.session.destroy((err) => {
    if (err) {
      console.error("logout failed:", err);
      return res
        .status(500)
        .json({ error: "Logout failed. Please try again." });
    }
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out" });
  });
});

export default router;
