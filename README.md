# CareerMatch · Job Match Agent

Team 22 · SRM Agentic AI Hackathon · PS6

CareerMatch helps the seeded student discover eligible roles, compare required skills, and save jobs to a shortlist. The workspace includes Job Search Chat, My Profile, and My Shortlist.

## Run locally

Use Node.js 20.9 or newer and install the locked dependencies.

```sh
npm ci
cp .env.example .env.local
```

1. Create a Supabase project in Mumbai and open its SQL Editor.
2. Run `seed/00_starter_example.sql` and `seed/ps6_job_match.sql` in that order. Use a fresh project. The PS6 seed drops and recreates its three tables.
3. Set `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `GEMINI_API_KEY`, `GEMINI_MODEL`, and `APP_PASSCODE` in `.env.local`. Use the trainer-approved Gemini model. The PS6 brief specifies `gemini-3.8-flash` as its default.
4. Run `npm run dev`, open [localhost:3000](http://localhost:3000), and enter the passcode. `/api/health` reports missing variable names.

Keep `.env.local` out of Git. Use the same server environment variable names if deploying to Vercel.

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
