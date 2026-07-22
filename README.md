# EatVera

A food & nutrition scanner: scan barcodes and food photos to get AI-powered
health analysis, log calories and workouts, set goals, and browse clean-eating
guides. Originally built on Manus and ported here to run as a standalone app.

**Stack:** React 19 + Vite + Wouter + TanStack Query + tRPC (frontend) · Express
+ tRPC (backend) · Drizzle ORM on MySQL · Anthropic Claude for AI analysis.

---

## What you need

1. **A MySQL database** — Railway can create one for you (below).
2. **An Anthropic API key** — get one free at
   [console.anthropic.com](https://console.anthropic.com/) (Settings → API Keys).
   This powers the food/photo analysis.

Everything is configured through environment variables — see
[`.env.example`](./.env.example) for the full list.

---

## Deploy on Railway (recommended)

Railway runs the app and the database together, so this is the fewest steps.

1. Go to [railway.app](https://railway.app/) and sign in with GitHub.
2. **New Project → Deploy from GitHub repo**, and pick this repository.
3. Add the database: in the project, click **New → Database → Add MySQL**.
   Railway provisions it and exposes a `DATABASE_URL` variable.
4. Open your app service → **Variables**, and set:
   - `DATABASE_URL` — reference the MySQL one Railway created
     (type `${{` and pick the MySQL service's `DATABASE_URL`), **or** paste its
     connection URL.
   - `JWT_SECRET` — any long random string. Generate one with
     `openssl rand -hex 32`.
   - `ANTHROPIC_API_KEY` — your key from console.anthropic.com.
   - *(optional)* `OWNER_EMAIL` — the email that should get admin access when it
     registers.
   - *(optional)* `ANTHROPIC_MODEL` — defaults to `claude-opus-4-8`; set to
     `claude-haiku-4-5` for a cheaper/faster model.
5. **Create the database tables** (one time). In the app service, open the
   **Settings → Deploy** shell (or use the Railway CLI: `railway run`) and run:
   ```
   pnpm db:push
   ```
   This creates all tables the app needs. Re-run it whenever the schema changes.
6. Railway builds (`pnpm build`) and starts (`pnpm start`) automatically. Open
   the generated URL, and register an account on the sign-in page.

> The app serves both the web frontend and the API from one process, so you only
> need this single service plus the MySQL database.

---

## Run locally

```bash
pnpm install
cp .env.example .env          # then fill in the values
pnpm db:push                  # create tables (needs DATABASE_URL pointing at a MySQL)
pnpm dev                      # http://localhost:3000
```

Useful scripts:

| Command         | What it does                                            |
| --------------- | ------------------------------------------------------- |
| `pnpm dev`      | Run the app in development (Vite + API, hot reload).    |
| `pnpm build`    | Build the client and bundle the server into `dist/`.    |
| `pnpm start`    | Run the production build (`node dist/index.js`).        |
| `pnpm db:push`  | Generate and apply database migrations.                 |
| `pnpm check`    | Type-check the whole project.                           |
| `pnpm test`     | Run the test suite.                                     |

---

## How it works

- **Accounts** are email + password. Sessions are stateless JWTs stored in an
  httpOnly cookie and signed with `JWT_SECRET`.
- **AI analysis** goes through the Anthropic Messages API
  (`server/_core/llm.ts`); the API key is read from `ANTHROPIC_API_KEY` and never
  leaves the server.
- **Uploaded photos** are kept inline (base64 data URLs) rather than in a bucket,
  so no separate storage service is needed to launch. See `server/storage.ts` if
  you later want to add S3 / R2 / Vercel Blob.

---

## Notes / follow-ups

- Some editorial "What's New" images that were hosted on Manus's CDN won't load;
  this is cosmetic and doesn't affect functionality. Swap in your own assets when
  convenient.
- Persistent image hosting and social/email notifications are stubbed for launch
  and can be added later without touching the rest of the app.
