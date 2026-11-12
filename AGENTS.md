# CareerMatch

CareerMatch is Team 22's PS6 Job Match Agent for the SRM Agentic AI Hackathon. Use the official starter's Next.js App Router, React, TypeScript, Tailwind CSS, Supabase JavaScript SDK, Gemini native function calling, and Zod.

- Apply the project skill at `.agents/skills/liquid-glass-ui/SKILL.md` to frontend work.
- Use `seed/ps6_job_match.sql` as the schema reference. The passcode gates the seeded student S001. Keep credentials and Supabase writes on the server.
- Keep eligibility checks server-side, including minimum CGPA, eligible branch, and inclusive deadlines in India time. Base scores on required skill coverage.
- Display real Gemini tool calls and Supabase results. Check for successful data writes before reporting changes. Avoid applying the destructive seed to an existing database.
- Keep `/api/agent`, `/api/health`, and the passcode flow compatible with the starter. Run the type check and production build after implementation changes.
