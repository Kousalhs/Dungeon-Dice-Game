# Dungeon Dice Duel

A turn-based dice battle game. Pick a hero, face a random computer opponent, and roll to attack until one side runs out of HP. Play as a guest or create an account to track your stats.

---

## Built with

- Node.js (ES modules)
- Express 4
- SQLite (`sqlite3`)
- `express-session`
- `crypto.scrypt`
- Vanilla JS
- Render

---

## Features

- **Hero roster from SQLite:** 12 seeded heroes served through `GET /api/heroes`
- **Battle API:** start a battle, play rounds and reset, all powered by a pure game engine with no HTTP code
- **Guest play and accounts:** register or log in with validated usernames, salted and hashed passwords, and cookie sessions
- **Run tracking:** each play session records total battles, wins, losses and draws
- **My stats page:** logged-in users see their totals and their best run (most wins, then fewest losses)
- **Consistent errors:** clear status codes (400, 401, 404) with JSON error bodies

## API

| Method | Route | Description |
| --- | --- | --- |
| GET | `/api/heroes` | `{ heroes: [...] }` |
| POST | `/api/battle/start` | Body `{ heroId }`, starts a battle |
| POST | `/api/battle/round` | Plays one round |
| POST | `/api/battle/reset` | Resets the dungeon (nothing is logged) |
| POST | `/api/auth/register` | Creates a user and logs them in |
| POST | `/api/auth/login` | Starts a session |
| POST | `/api/auth/logout` | Ends the session |
| GET | `/api/auth/me` | Current login status |
| GET | `/api/stats` | Totals and best run for the logged-in user |

## Run locally

```bash
npm install
npm run seed    # creates and fills the database
npm start       # http://localhost:3000
```

Set `SESSION_SECRET` for anything beyond local development.

## What I learned

- Structuring an Express app with routers, middleware and correct mount order
- Designing and seeding a SQLite database, and using parameterised queries
- Migrating a schema safely (adding and backfilling a `draws` column)
- Validating input, hashing passwords with a salt, and managing sessions
- Protecting routes and handling errors with proper status codes
- Debugging and deploying a Node app to Render

## Deployment notes

Locally, the database persists, sessions survive restarts and each run is fast. The free Render tier changes a few things:

- **Ephemeral storage:** `database.db` isn't in the repo and the disk is wiped on deploys and restarts. The seed script runs before the server starts (`npm run seed && npm start`), so the heroes always exist. Registered users and stats are temporary on the live demo.
- **In-memory sessions:** the default `MemoryStore` is cleared on restart, so users get logged out.
- **Cold starts:** free services sleep when idle, so the first visit afterwards is slow.
- **Shared battle:** the engine holds one global battle, so two simultaneous players would share it.

---


# Live Demo

[Link](https://dungeon-dice-game.onrender.com/)
