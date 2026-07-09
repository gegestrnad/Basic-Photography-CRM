# Deploying to Vercel

This guide covers everything you need to deploy the Photography Client Management app to Vercel.

## Why changes are needed

Vercel runs Next.js as **serverless functions** — each API route becomes an isolated function. This has two implications:

1. **No persistent filesystem** — SQLite stores data in a local file (`db/custom.db`), but Vercel's serverless functions don't share a filesystem across invocations. Every request would see an empty (or different) database. **You must use a hosted PostgreSQL database.**

2. **Build output** — Vercel handles the build output automatically. The `output: "standalone"` setting and custom `cp` commands in the build script are for self-hosted Docker deployments and break Vercel's routing (causing the 404 NOT_FOUND error).

## Prerequisites

- A [Vercel account](https://vercel.com/signup)
- A hosted PostgreSQL database. Free options:
  - [Neon](https://neon.tech) (recommended — generous free tier, serverless PostgreSQL)
  - [Supabase](https://supabase.com)
  - [Railway](https://railway.app)

## Step 1: Create a PostgreSQL database

1. Sign up at [Neon](https://neon.tech) (or Supabase/Railway).
2. Create a new project.
3. Copy the connection string — it looks like:
   ```
   postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require
   ```

## Step 2: Switch the Prisma provider to PostgreSQL

In `prisma/schema.prisma`, change the `provider` from `"sqlite"` to `"postgresql"`:

```prisma
datasource db {
  provider = "postgresql"   // ← was "sqlite"
  url      = env("DATABASE_URL")
}
```

## Step 3: Push the schema to your production database

Set the `DATABASE_URL` environment variable to your Neon connection string and push the schema:

```bash
# Set your production database URL
export DATABASE_URL="postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require"

# Push the schema to create all tables
bun run db:push

# Seed the database with demo data (admin@example.com / admin123)
bun run seed
```

## Step 4: Import the project to Vercel

1. Push your code to GitHub/GitLab/Bitbucket.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. Vercel will auto-detect Next.js — no framework preset changes needed.

## Step 5: Configure environment variables

In the Vercel project settings → **Environment Variables**, add the following:

| Name | Value | Environments |
|------|-------|-------------|
| `DATABASE_URL` | `postgresql://user:pass@ep-xxx.neon.tech/dbname?sslmode=require` | Production, Preview, Development |
| `NEXTAUTH_SECRET` | (generate with `openssl rand -base64 32`) | Production, Preview, Development |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | Production only |

> **Important:** Do NOT commit your `.env` file. The `.gitignore` already excludes it. Set env vars in the Vercel dashboard instead.

## Step 6: Deploy

Click **Deploy**. Vercel will:
1. Run `bun install` (or `npm install`)
2. Run `postinstall` → `prisma generate` (generates the Prisma Client)
3. Run `build` → `prisma generate && next build`

The build typically takes 1–2 minutes.

## Step 7: Verify

Once deployed, visit your Vercel URL. You should see the login page. Log in with:
- **Admin:** `admin@example.com` / `admin123`
- **User:** `user@example.com` / `user123`

## Troubleshooting

### 404 NOT_FOUND
This usually means the build succeeded but routing failed. Common causes (all already fixed in this repo):
- `output: "standalone"` in `next.config.ts` — **removed** (Vercel doesn't need it)
- Custom `build` script with `cp` commands — **removed** (Vercel handles output)
- Missing `postinstall` script for `prisma generate` — **added**

### Database connection errors
- Ensure `DATABASE_URL` is set in Vercel env vars for **all** environments (Production + Preview + Development)
- Ensure the connection string includes `?sslmode=require` for Neon/Supabase
- Check that your database provider allows connections from Vercel's IP ranges (most do by default)

### Prisma Client not found
If you see `Cannot find module '@prisma/client'` or `.prisma/client/default`:
- The `postinstall` script should handle this. If it doesn't, run `prisma generate` locally, commit the generated files, and redeploy.

### Login fails (401 on `/api/auth/session`)
- Ensure `NEXTAUTH_SECRET` is set and is the same value you used locally when seeding the database
- Ensure `NEXTAUTH_URL` matches your Vercel deployment URL (e.g. `https://your-app.vercel.app`)
- The cookie configuration in `src/lib/auth.ts` is already set up to work behind Vercel's HTTPS proxy

### "Authentication required" errors in console
This was a client-side issue that has been fixed — 401 responses now trigger a graceful sign-out instead of throwing console errors.

## Local development

For local development, keep using SQLite (no external database needed):

1. In `prisma/schema.prisma`, keep `provider = "sqlite"`
2. In `.env`, keep `DATABASE_URL="file:./db/custom.db"`
3. Run `bun run db:push && bun run seed`
4. Run `bun run dev`

When you're ready to deploy to Vercel, switch to PostgreSQL:
1. In `prisma/schema.prisma`, change `provider` to `"postgresql"`
2. Set `DATABASE_URL` to your Neon/Supabase URL (in `.env` for local, or in Vercel env vars for production)
3. Run `bun run db:push` to create tables on the remote DB
4. Run `bun run seed` to populate demo data
5. Commit and push — Vercel will redeploy automatically
