import type { Job, JobMatch } from "@/lib/careermatch-types";
import { Icon } from "./Icon";

const deadline = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export function JobCard({ job, score, skills, action }: {
  job: Job;
  score: number | null;
  skills?: Pick<JobMatch, "matched" | "missing">;
  action?: React.ReactNode;
}) {
  return (
    <article className="surface job-card">
      <div className="job-head">
        <span className="tile-icon"><Icon name="briefcase" size={19} /></span>
        <div className="job-name">
          <h3>{job.title}</h3>
          <p>{job.company}</p>
        </div>
        {score !== null && <span className="score" title="Share of required skills in your profile">{score}% match</span>}
      </div>
      <div className="job-meta">
        <span><Icon name="pin" size={15} />{job.city}{job.city !== job.work_mode && ` · ${job.work_mode}`}</span>
        <span>{job.job_type} · {job.min_cgpa.toFixed(1)} min CGPA</span>
      </div>
      <p className="deadline">Apply by <time dateTime={job.apply_by}>{deadline.format(new Date(job.apply_by))}</time></p>
      {skills ? (
        <div className="skill-groups">
          {skills.matched.length > 0 && <SkillList label="Matched skills" items={skills.matched} tone="match" />}
          {skills.missing.length > 0 && <SkillList label="Skills to build" items={skills.missing} tone="gap" />}
          {job.required_skills.length === 0 && <p className="muted">No required skills listed.</p>}
        </div>
      ) : (
        <SkillList label="Required skills" items={job.required_skills} />
      )}
      {action && <div className="job-action">{action}</div>}
    </article>
  );
}

export function SkillList({ label, items, tone }: { label: string; items: string[]; tone?: "match" | "gap" }) {
  if (items.length === 0) return null;
  return (
    <div className="skill-group">
      <p>{label}</p>
      <ul className="chip-list">
        {items.map((skill) => <li key={skill} className="chip" data-tone={tone}>{skill}</li>)}
      </ul>
    </div>
  );
}
