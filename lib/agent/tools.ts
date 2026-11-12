import "server-only";
import { z } from "zod";
import { defineTool, type AgentTool } from "./defineTool";
import { addSkill, readProfile, saveEligibleJob, scoreEligibleJob, searchEligibleJobs } from "../careermatch";

const jobId = z.number().int().positive().describe("Exact job ID from searchJobs.");

export const tools: AgentTool[] = [
  defineTool({
    name: "getMyProfile",
    description: "Use this when you need the current student's stored profile, skills, or preferences.",
    schema: z.object({}),
    run: () => readProfile(),
  }),
  defineTool({
    name: "searchJobs",
    description: "Use this to find eligible jobs. Returns matches ranked by required skill coverage, then earliest deadline. Use an empty filter for all jobs. Use a short role substring such as 'data analyst'.",
    schema: z.object({
      city: z.string().trim().min(1).max(80).optional().describe("Exact city, such as Chennai."),
      role: z.string().trim().min(1).max(100).optional().describe("Optional role substring."),
      workMode: z.enum(["Onsite", "Hybrid", "Remote"]).optional(),
      jobType: z.enum(["Full-time", "Internship"]).optional(),
    }),
    run: async (filters) => {
      const matches = await searchEligibleJobs(filters);
      return { count: matches.length, matches: matches.slice(0, 12) };
    },
  }),
  defineTool({
    name: "scoreJobMatch",
    description: "Use this to explain the match and missing skills for a particular eligible job.",
    schema: z.object({ jobId }),
    run: ({ jobId }) => scoreEligibleJob(jobId),
  }),
  defineTool({
    name: "saveToShortlist",
    description: "Use this only when asked to save a job. Accepts up to ten exact job IDs from search or scoring. Each job is rechecked and an existing entry is reported separately.",
    writes: true,
    schema: z.object({ jobIds: z.array(jobId).min(1).max(10) }),
    run: async ({ jobIds }) => {
      const outcomes = [];
      for (const id of new Set(jobIds)) {
        try {
          outcomes.push({ jobId: id, saved: true as const, match: await saveEligibleJob(id) });
        } catch (error) {
          outcomes.push({ jobId: id, saved: false as const, error: error instanceof Error ? error.message : "Could not save this job." });
        }
      }
      return { outcomes };
    },
  }),
  defineTool({
    name: "updateMySkills",
    description: "Use this only when asked to add a skill to the student's profile. Existing skills are preserved.",
    writes: true,
    schema: z.object({
      skill: z.string().trim().min(1).max(60).regex(/^[\p{L}\p{N}][\p{L}\p{N} .+#&/()-]*$/u)
        .describe("One skill, for example Docker or C++."),
    }),
    run: ({ skill }) => addSkill(skill),
  }),
];
