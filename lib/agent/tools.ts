import "server-only";
import { z } from "zod";
import { defineTool, type AgentTool } from "./defineTool";
import { addSkill, readProfile, readShortlistedJobMatch, saveEligibleJob, scoreEligibleJob, searchEligibleJobs } from "../careermatch";

const jobId = z.number().int().positive().describe("Exact job ID from searchJobs.");

export function toolsForProfile(profileId: string): AgentTool[] {
  return [
    defineTool({
      name: "getMyProfile",
      description: "Use this when you need the current student's stored profile, skills, or preferences.",
      schema: z.object({}),
      run: () => readProfile(profileId),
    }),
    defineTool({
      name: "searchJobs",
      description: "Use this to find eligible jobs. Returns matches ranked by required skill coverage, then earliest deadline. Use an empty filter for all jobs. Use a short role substring such as 'data analyst'.",
      schema: z.object({
        city: z.string().trim().min(1).max(80).optional().describe("Exact requested city. Omit it for a new request that does not name a city."),
        role: z.string().trim().min(1).max(100).optional().describe("Optional role substring."),
        workMode: z.enum(["Onsite", "Hybrid", "Remote"]).optional(),
        jobType: z.enum(["Full-time", "Internship"]).optional(),
      }),
      run: (filters) => searchEligibleJobs(profileId, filters),
    }),
    defineTool({
      name: "scoreJobMatch",
      description: "Use this to explain the match and missing skills for a particular eligible job.",
      schema: z.object({ jobId }),
      run: ({ jobId }) => scoreEligibleJob(profileId, jobId),
    }),
    defineTool({
      name: "draftCoverNote",
      description: "Use only when asked to draft a cover note for a specific job. Checks the current student's shortlist and eligibility, then prepares a note from the listing and verified skills.",
      schema: z.object({ jobId }),
      run: async ({ jobId }) => {
        const { job, matched } = await readShortlistedJobMatch(profileId, jobId);
        const skillLine = matched.length
          ? `My skills include ${new Intl.ListFormat("en").format(matched)}, which are listed among the requirements for this role.`
          : "I would welcome the opportunity to learn more about the role and its skill requirements.";
        return `Dear Hiring Team at ${job.company},\n\nI’m interested in the ${job.title} position. ${skillLine}\n\nThank you for considering my application. I’d welcome the opportunity to discuss the role.\n\nBest regards,\n[Your name]`;
      },
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
            const match = await saveEligibleJob(profileId, id);
            outcomes.push({ jobId: id, saved: true as const, status: match.added ? "newly_saved" : "already_saved", match });
          } catch (error) {
            outcomes.push({ jobId: id, saved: false as const, status: "failed", error: error instanceof Error ? error.message : "Could not save this job." });
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
      run: async ({ skill }) => {
        const result = await addSkill(profileId, skill);
        return { ...result, status: result.added ? "newly_added" : "already_present" };
      },
    }),
  ];
}
