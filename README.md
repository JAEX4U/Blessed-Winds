# Blessed Winds

A playable Next.js (App Router) website with a PostgreSQL database, Drizzle ORM, Tailwind CSS, wind games, a color-based shared-pot spin game, a shop, profile, FAQ, and leaderboard.

**Read the illustrated guide inside the website at `/guide`.**

## Run it locally

You need **Node.js 20.9+** and a running **PostgreSQL** database.

1. Download or clone this project and run `npm install`.
2. Create an empty PostgreSQL database.
3. Copy `.env.example` to `.env` (`cp .env.example .env`; on Windows PowerShell: `Copy-Item .env.example .env`). Replace the example `DATABASE_URL` with the connection URL for your database. Keep `.env` private.
4. Run `npx drizzle-kit push` to create the tables.
5. Run `npm run dev` and open `http://localhost:3000`.

To check a running site's database connection, visit `/api/health`.

## Make it yours

| Change | File |
| --- | --- |
| Logo, name, navigation | `src/components/Header.tsx` |
| Homepage text and cards | `src/components/HomeSection.tsx` |
| Browser title and SEO description | `src/app/layout.tsx` |
| Global styling | `src/app/globals.css` |
| Example items, quests, demo rivals | `src/lib/seed.ts` |
| Database tables | `src/db/schema.ts` |
| Game and balance rules | `src/app/api/` |

The demo seed runs only when the relevant tables are empty. Changing a seed value does **not** change already saved records.

## Put it online

1. Put the source code on GitHub. `.gitignore` excludes `.env`, build output, and dependencies.
2. Create a managed PostgreSQL database. The local `localhost` database is not reachable from a hosted site.
3. Set **`DATABASE_URL`** in your host's environment-variable settings. Apply the schema to the **hosted** database by running `npx drizzle-kit push` securely with its connection URL in your environment; never commit the URL or paste passwords into public logs.
4. Import the GitHub repository into a Next.js host such as Vercel, deploy it, check `/api/health`, and add a custom domain in the host's domain settings.

Docs: [Next.js deployment](https://nextjs.org/docs/app/getting-started/deploying) · [Drizzle schema push](https://orm.drizzle.team/docs/drizzle-kit-push) · [Vercel deployments](https://vercel.com/docs/deployments)

## Important before a public launch

This is a **demo**, not a production-ready multiplayer account system. Every visitor currently shares the same demo player, and rivals in the spin game are simulated. For distinct real users, add sign-up and login, per-user authorization for all API routes, rate limits, and concurrency-safe balance/game transactions. Never use this demo for real-money wagering.
