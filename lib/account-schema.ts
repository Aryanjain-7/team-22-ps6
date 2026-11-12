import { z } from "zod";
import { normalizeProfileSkills } from "./skills";

export const branches = ["CSE", "IT", "AI & DS", "ECE", "EEE"] as const;

export const accountCredentials = z.object({
  username: z.string().trim().toLowerCase().regex(/^[a-z][a-z0-9_-]{2,23}$/),
  password: z.string().min(8).max(64).refine((value) => new TextEncoder().encode(value).length <= 72),
});

export const newAccount = accountCredentials.extend({ passcode: z.string().min(1).max(100) });

const list = z.array(z.string().trim().min(1).max(60)).max(20)
  .transform((values) => [...new Set(values)]);

export const profileDetails = z.object({
  name: z.string().trim().min(1).max(60),
  degree: z.string().trim().min(1).max(40),
  branch: z.enum(branches),
  grad_year: z.number().int().min(2000).max(2100),
  cgpa: z.number().min(0).max(10).multipleOf(0.1),
  preferred_cities: list,
  skills: list.transform(normalizeProfileSkills).pipe(list),
  interests: z.string().trim().max(250).transform((value) => value || null),
}).strict();
