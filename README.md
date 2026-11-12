# CareerMatch · Job Match Agent

Team 22 · SRM Agentic AI Hackathon · PS6

CareerMatch helps the seeded student discover eligible roles, compare required skills, and save jobs to a shortlist. The workspace includes Job Search Chat, My Profile, and My Shortlist.

## Run locally

Use Node.js 22 or newer, the Supabase CLI, and the PostgreSQL `psql` client. The local database runs separately from any hosted project.

```sh
npm ci
supabase start --runtime native
npm run db:local
npm run dev -- --webpack --hostname 127.0.0.1
```

The native Supabase runtime supports Apple silicon and Linux. With a Docker-compatible runtime, use `supabase start --runtime docker` instead. If the CLI is installed outside your path, set `SUPABASE_BIN` to its executable when running `npm run db:local`.

The database setup applies the official seed to a fresh local project and configures `.env.local`. Add a Google AI Studio key to `GEMINI_API_KEY` in that file and use the trainer-approved `GEMINI_MODEL`. Open [localhost:3000](http://localhost:3000) and sign in using the local `APP_PASSCODE` value. `/api/health` lists which settings are configured.

## Prepare a hosted deployment

1. Create a dedicated Supabase project in Mumbai. Enable its Data API.
2. Run `node scripts/database-sql.mjs > careermatch-bootstrap.sql` and apply the generated SQL in the fresh project's SQL Editor. The bootstrap aborts if an application table already exists. For a database already seeded with the starter and PS6 files, review and apply `supabase/production.sql` instead.
3. Import this repository into Vercel. Set `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `GEMINI_API_KEY`, `GEMINI_MODEL`, and a separate strong `APP_PASSCODE` in the production environment. Keep the API keys and passcode in Vercel's secret fields.
4. Run the checks below, deploy, then sign in and run the demo. Use your own team passcode. `.env.local` stays outside Git.

The hackathon workspace uses one shared student profile. The database ranks and limits search results before returning them to the app, so Supabase's row cap does not truncate the candidate set.
## Demo

- Open My Profile to view the current skills, branch, and CGPA for S001.
- Ask “Find eligible jobs in Chennai and save the top three.” Expand Agent activity to see the real tool calls, then open My Shortlist to verify the saved rows.
- Ask “Which skills am I missing for data analyst roles?” Compare the matched and missing skills on each result.
- Ask “Add Docker to my profile and search again.” Open My Profile to verify the saved skill. Only required skills affect the score, so adding a skill may leave some scores unchanged.

Gemini selects from five Zod-validated tools. Profile reads, searches, and scoring use Supabase data. `saveToShortlist` rechecks CGPA, branch, and the India-time deadline and uses the unique student/job key to prevent duplicates. `updateMySkills` preserves existing skills and uses a conditional update to avoid lost writes. Eligibility includes jobs whose deadline is today. The score is the rounded percentage of required skills that match the profile.

## Checks

```sh
npm run typecheck
npm run build
```
