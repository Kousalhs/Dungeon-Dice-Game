import express from "express";
import session from "express-session";
import path from "node:path";
import { fileURLToPath } from "node:url";

import diceGameRoutes from "./routes/diceGameRoutes.js";
import authRouter from "./routes/auth.js";
import meRouter from "./routes/me.js";
import statsRouter from "./routes/stats.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-only-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: "lax", maxAge: 1000 * 60 * 60 * 24 },
  }),
);

app.use(express.static(path.join(__dirname, "public")));

// Mount /me BEFORE /auth so it is matched first
app.use("/api/auth/me", meRouter);
app.use("/api/auth", authRouter);
app.use("/api/stats", statsRouter);
app.use("/api", diceGameRoutes);

app.listen(PORT, () =>
  console.log(`Dungeon Dice Duel running on port ${PORT}`),
);
