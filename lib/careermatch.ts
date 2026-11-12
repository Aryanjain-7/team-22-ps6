import "server-only";
import { getSupabase } from "./supabase";
import { todayInIndia } from "./dates";
import type { Job, JobMatch, Profile, SavedJob } from "./careermatch-types";

const STUDENT = "S001";
const JOB_COLUMNS = "id,title,company,city,work_mode,job_type,min_cgpa,eligible_branches,required_skills,apply_by,description";
const normalize = (value: string) => value.trim().replace(/\s+/g, " ").toLowerCase();

export async function readProfile(): Promise<Profile> {
  const { data, error } = await getSupabase().from("profiles")
    .select("id,name,degree,branch,grad_year,cgpa,preferred_cities,skills,interests")
    .eq("id", STUDENT).single<Profile>();
  if (error) throw new Error("The student profile is unavailable.");
  return data;
}

async function readJob(id: number): Promise<Job> {
  const { data, error } = await getSupabase().from("jobs").select(JOB_COLUMNS)
    .eq("id", id).maybeSingle<Job>();
  if (error) throw new Error("Could not load that job.");
  if (!data) throw new Error("That job was not found.");
  return data;
}

function isEligible(profile: Profile, job: Job, today: string) {
  return profile.cgpa >= job.min_cgpa && job.apply_by >= today &&
    job.eligible_branches.includes(profile.branch);
}

function compareSkills(profile: Profile, job: Job): JobMatch {
  const current = new Set(profile.skills.map(normalize));
  const required = [...new Set(job.required_skills.map(normalize).filter(Boolean))];
  const matched = required.filter((skill) => current.has(skill));
  const missing = required.filter((skill) => !current.has(skill));
  return { job, score: required.length ? Math.round(matched.length * 100 / required.length) : 100, matched, missing };
}

export async function searchEligibleJobs(filters: {
  city?: string;
  role?: string;
  workMode?: Job["work_mode"];
  jobType?: Job["job_type"];
}) {
  const { data, error } = await getSupabase().rpc("careermatch_search", {
    profile_ref: STUDENT,
    eligible_on: todayInIndia(),
    city_filter: filters.city ? normalize(filters.city) : null,
    role_filter: filters.role ? normalize(filters.role) : null,
    mode_filter: filters.workMode ?? null,
    type_filter: filters.jobType ?? null,
  }).returns<{ count: number; matches: JobMatch[] }>();
  if (error) throw new Error("Could not search the jobs database.");
  return data;
}

export async function scoreEligibleJob(id: number) {
  const [profile, job] = await Promise.all([readProfile(), readJob(id)]);
  if (!isEligible(profile, job, todayInIndia())) {
    throw new Error("This job is unavailable for your CGPA, branch, or application deadline.");
  }
  return compareSkills(profile, job);
}

export async function readShortlist(): Promise<SavedJob[]> {
  const { data, error } = await getSupabase().from("shortlists")
    .select(`job_id,match_score,reason,created_at,job:jobs!inner(${JOB_COLUMNS})`)
    .eq("profile_id", STUDENT).order("created_at", { ascending: false })
    .order("id", { ascending: false }).returns<SavedJob[]>();
  if (error) throw new Error("Could not load your shortlist.");
  return data;
}

export async function saveEligibleJob(id: number) {
  const match = await scoreEligibleJob(id);
  const { data, error } = await getSupabase().from("shortlists")
    .upsert({
      profile_id: STUDENT,
      job_id: id,
      match_score: match.score,
      reason: `${match.matched.length} of ${match.matched.length + match.missing.length} required skills matched`,
    }, { onConflict: "profile_id,job_id", ignoreDuplicates: true }).select("job_id").maybeSingle();
  if (error) throw new Error("Could not save this job. Try again.");
  return { ...match, added: Boolean(data) };
}

export async function addSkill(skill: string) {
  const normalized = normalize(skill);
  for (let attempt = 0; attempt < 3; attempt++) {
    const profile = await readProfile();
    if (profile.skills.some((value) => normalize(value) === normalized)) {
      return { skills: profile.skills, added: false };
    }
    // Compare the old array so simultaneous updates cannot erase each other's skills.
    const previous = `{${profile.skills.map((value) => JSON.stringify(value)).join(",")}}`;
    const { data, error } = await getSupabase().from("profiles")
      .update({ skills: [...profile.skills, normalized] }).eq("id", STUDENT)
      .eq("skills", previous).select("skills").maybeSingle<{ skills: string[] }>();
    if (error) throw new Error("Could not update your skills. Try again.");
    if (data) return { skills: data.skills, added: true };
  }
  throw new Error("Your profile changed while updating. Try again.");
}
