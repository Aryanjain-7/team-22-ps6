"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Profile, SavedJob } from "@/lib/careermatch-types";
import { useCareerChat } from "./ChatProvider";
import { Icon } from "./Icon";
import { JobCard, SkillList } from "./JobCard";

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
  const { result, retry } = useStudentResource<Profile>("/api/profile", profileRevision);
  const profile = result?.data;

  return (
    <section className="data-page">
      <header className="page-heading">
        <h1>My Profile</h1>
        <p>The academic details and skills CareerMatch uses to find eligible roles.</p>
      </header>
      {!profile ? <PageState error={result?.error} retry={retry} label="Loading your profile…" /> : (
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
                <div><dt>Student ID</dt><dd>{profile.id}</dd></div>
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
  const { shortlistRevision } = useCareerChat();
  const { result, retry } = useStudentResource<SavedJob[]>("/api/shortlist", shortlistRevision);
  const jobs = result?.data;

  return (
    <section className="data-page">
      <header className="page-heading">
        <h1>My Shortlist</h1>
        <p>Revisit saved roles and keep track of their application deadlines.</p>
      </header>
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
                  action={entry.reason && <p className="muted">{entry.reason} when saved</p>} />
              ))}
            </div>
          </section>
        )}
    </section>
  );
}
