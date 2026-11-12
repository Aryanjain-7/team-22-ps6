"use client";

import { useState, type FormEvent } from "react";
import { branches } from "@/lib/account-schema";
import type { Profile } from "@/lib/careermatch-types";

export function ProfileEditor({ profile, onSaved, onCancel }: {
  profile?: Profile;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const value = (key: string) => String(fields.get(key) ?? "");
    const list = (key: string) => value(key).split(",").map((item) => item.trim()).filter(Boolean);
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: value("name"), degree: value("degree"), branch: value("branch"),
          grad_year: Number(value("grad_year")), cgpa: Number(value("cgpa")),
          preferred_cities: list("preferred_cities"), skills: list("skills"), interests: value("interests"),
        }),
      });
      if (response.status === 401) {
        window.location.assign("/login");
        return;
      }
      if (!response.ok) {
        const data = await response.json();
        setError(data.error ?? "Could not save your profile.");
        return;
      }
      onSaved();
    } catch {
      setError("Could not reach CareerMatch. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="surface data-card profile-editor" onSubmit={save}>
      <h2>{profile ? "Edit details" : "Set up your profile"}</h2>
      <p className="muted">Use fictional details for the hackathon demo. Your branch, CGPA, and skills determine your matches.</p>
      <div className="profile-form-grid">
        <label>Display name<input name="name" defaultValue={profile?.name} required maxLength={60} /></label>
        <label>Degree<input name="degree" defaultValue={profile?.degree} required maxLength={40} placeholder="B.Tech" /></label>
        <label>Branch<select name="branch" defaultValue={profile?.branch ?? ""} required>
          <option value="" disabled>Select your branch</option>
          {branches.map((branch) => <option key={branch}>{branch}</option>)}
        </select></label>
        <label>Graduation year<input name="grad_year" type="number" min={2000} max={2100} defaultValue={profile?.grad_year} required /></label>
        <label>CGPA out of 10<input name="cgpa" type="number" min={0} max={10} step="0.1" defaultValue={profile?.cgpa} required /></label>
        <label>Preferred cities<input name="preferred_cities" defaultValue={profile?.preferred_cities.join(", ")}
          placeholder="Chennai, Bengaluru" maxLength={400} /></label>
        <label className="profile-form-wide">Skills<input name="skills" defaultValue={profile?.skills.join(", ")}
          placeholder="Python, C++, LLM APIs" maxLength={600} aria-describedby="skills-hint" />
          <small id="skills-hint" className="muted">Separate skills with commas.</small>
        </label>
        <label className="profile-form-wide">Interests<textarea name="interests" rows={2} defaultValue={profile?.interests ?? ""}
          maxLength={250} /></label>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="form-actions">
        <button className="primary-button" type="submit" disabled={pending}>{pending ? "Saving…" : "Save profile"}</button>
        {profile && <button className="secondary-button" type="button" disabled={pending} onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}
