"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Profile, SavedJob } from "@/lib/careermatch-types";
import { useCareerChat } from "./ChatProvider";
import { Icon } from "./Icon";
import { JobCard, SkillList } from "./JobCard";
import { PageHeading } from "./PageHeading";
import { ProfileEditor } from "./ProfileEditor";

type Resource<T> = { data: T; error?: never } | { error: string; data?: never };

function useStudentResource<T>(url: string, revision: number) {
  const [result, setResult] = useState<Resource<T> | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(url, { signal: controller.signal, cache: "no-store" });
        if (response.status === 401) {
          window.location.assign("/login");
          return;
        }
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Could not load this page.");
        if (!controller.signal.aborted) setResult({ data: payload as T });
      } catch (error) {
        if (!controller.signal.aborted) {
          setResult({ error: error instanceof Error ? error.message : "Could not load this page." });
        }
      }
    }
    void load();
    return () => controller.abort();
  }, [url, revision, attempt]);

  return {
    result,
    retry: () => { setResult(null); setAttempt((value) => value + 1); },
  };
}

function PageState({ error, retry, label }: { error?: string; retry: () => void; label: string }) {
  return (
    <div className="surface page-state">
      <span className="tile-icon"><Icon name="activity" /></span>
      {error ? (
        <>
          <p role="alert">{error}</p>
          <button className="secondary-button" type="button" onClick={retry}>Try again</button>
        </>
      ) : <p role="status">{label}</p>}
    </div>
  );
}

export function ProfilePage() {
  const { profileRevision } = useCareerChat();
  const { result, retry } = useStudentResource<({ canEdit: boolean } & Profile) | { canEdit: true }>("/api/profile", profileRevision);
  const data = result?.data;
  const profile = data && "id" in data ? data : undefined;
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <section className="data-page">
      <PageHeading title="My Profile" icon="user"
        description="The academic details and skills CareerMatch uses to find eligible roles."
        action={profile?.canEdit && !editing && (
          <button type="button" className="secondary-button" onClick={() => { setEditing(true); setSaved(false); }}>Edit details</button>
        )} />
      {saved && <p className="profile-saved" role="status">Profile saved.</p>}
      {data?.canEdit && (editing || !profile) ? (
        <ProfileEditor profile={profile} onCancel={() => setEditing(false)} onSaved={() => {
          setEditing(false);
          setSaved(true);
          retry();
        }} />
      ) : !profile ? <PageState error={result?.error} retry={retry} label="Loading your profile…" /> : (
        <>
          <div className="surface identity">
            <span className="profile-avatar" aria-hidden="true">
              {profile.name.trim().split(/\s+/).slice(0, 2).map((name) => name[0]).join("").toUpperCase()}
            </span>
            <div>
              <h2>{profile.name}</h2>
              <p>{profile.degree} · {profile.branch}</p>
            </div>
            <Link className="primary-button" href="/">Search jobs <Icon name="arrow" size={17} /></Link>
          </div>
          <div className="profile-grid">
            <section className="surface data-card">
              <h2>Academic details</h2>
              <dl className="facts">
                {!profile.canEdit && <div><dt>Student ID</dt><dd>{profile.id}</dd></div>}
                <div><dt>CGPA</dt><dd>{profile.cgpa.toFixed(1)} / 10</dd></div>
                <div><dt>Graduation year</dt><dd>{profile.grad_year}</dd></div>
              </dl>
            </section>
            <section className="surface data-card">
              <h2>Skills and preferences</h2>
              {profile.skills.length ? <SkillList label="Current skills" items={profile.skills} /> : <p className="muted">No skills on your profile yet.</p>}
              <SkillList label="Preferred cities" items={profile.preferred_cities} />
              {profile.interests && <dl className="interests"><dt>Interests</dt><dd>{profile.interests}</dd></dl>}
            </section>
          </div>
        </>
      )}
    </section>
  );
}

export function ShortlistPage() {
  const { shortlistRevision, pending, send } = useCareerChat();
  const router = useRouter();
  const { result, retry } = useStudentResource<SavedJob[]>("/api/shortlist", shortlistRevision);
  const jobs = result?.data;

  return (
    <section className="data-page">
      <PageHeading title="My Shortlist" icon="bookmark"
        description="Revisit saved roles and keep track of application deadlines." />
      {!jobs ? <PageState error={result?.error} retry={retry} label="Loading your shortlist…" /> :
        jobs.length === 0 ? (
          <div className="surface page-state empty-state">
            <span className="tile-icon"><Icon name="bookmark" size={24} /></span>
            <h2>No saved jobs yet</h2>
            <p>Find roles that fit your skills, then shortlist the ones you want to revisit.</p>
            <Link className="primary-button" href="/">Find job matches <Icon name="arrow" size={17} /></Link>
          </div>
        ) : (
          <section aria-labelledby="saved-heading">
            <h2 className="saved-heading" id="saved-heading">{jobs.length} saved {jobs.length === 1 ? "role" : "roles"}</h2>
            <div className="job-grid">
              {jobs.map((entry) => (
                <JobCard key={entry.job_id} job={entry.job} score={entry.match_score}
                  action={
                    <div className="shortlist-actions">
                      {entry.reason && <p className="muted">{entry.reason} when saved</p>}
                      <button type="button" className="secondary-button" disabled={pending}
                        aria-label={`Draft cover note for ${entry.job.title} at ${entry.job.company}`}
                        onClick={() => {
                          void send(`Draft a cover note for my shortlisted job #${entry.job_id}.`);
                          router.push("/");
                        }}>
                        Draft cover note <Icon name="arrow" size={16} />
                      </button>
                    </div>
                  } />
              ))}
            </div>
          </section>
        )}
    </section>
  );
}
