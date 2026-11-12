export type Profile = {
  id: string;
  name: string;
  degree: string;
  branch: string;
  grad_year: number;
  cgpa: number;
  preferred_cities: string[];
  skills: string[];
  interests: string | null;
};

export type Job = {
  id: number;
  title: string;
  company: string;
  city: string;
  work_mode: "Onsite" | "Hybrid" | "Remote";
  job_type: "Full-time" | "Internship";
  min_cgpa: number;
  eligible_branches: string[];
  required_skills: string[];
  apply_by: string;
  description: string;
};

export type JobMatch = {
  job: Job;
  score: number;
  matched: string[];
  missing: string[];
};

export type SavedJob = {
  job_id: number;
  job: Job;
  match_score: number | null;
  reason: string | null;
  created_at: string;
};

export const toolNames = {
  getMyProfile: "Read student profile",
  searchJobs: "Searched eligible jobs",
  scoreJobMatch: "Compared required skills",
  getShortlistedJob: "Checked shortlisted job",
  saveToShortlist: "Updated shortlist",
  updateMySkills: "Updated profile skills",
} as const;
