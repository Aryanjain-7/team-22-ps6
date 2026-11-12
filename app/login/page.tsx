"use client";

import { useState, type FormEvent } from "react";
import { Icon } from "@/components/Icon";

const options = [
  { id: "demo", label: "Team demo" },
  { id: "individual", label: "My account" },
  { id: "register", label: "Create account" },
] as const;

export default function LoginPage() {
  const [mode, setMode] = useState<typeof options[number]["id"]>("demo");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    setPending(true);
    setError("");
    try {
      const response = await fetch(mode === "demo" ? "/api/login" : "/api/login/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...fields, mode }),
      });
      if (response.ok) {
        window.location.assign(mode === "register" ? "/profile" : "/");
        return;
      }
      const data = await response.json();
      setError(data.error ?? "Login failed. Try again.");
    } catch {
      setError("Could not reach CareerMatch. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="login-page">
      <div className="surface login-card">
        <div className="brand">
          <span className="brand-mark"><Icon name="spark" size={19} /></span>
          <span>Career<span className="brand-accent">Match</span></span>
        </div>
        <h1>Welcome to CareerMatch</h1>
        <div className="login-options" role="group" aria-label="Sign-in options">
          {options.map(({ id, label }) => (
            <button key={id} type="button" className="menu-action" disabled={pending}
              aria-pressed={id === mode} onClick={() => { setMode(id); setError(""); }}>{label}</button>
          ))}
        </div>
        <form key={mode} onSubmit={handleSubmit} className="login-form">
          <p className="muted">{mode === "demo" ? "Use the team passcode to open the seeded demo."
            : mode === "register" ? "Choose a fictional username for your own workspace."
            : "Sign in to your profile and shortlist."}</p>
          {mode !== "demo" && (
            <>
              <label htmlFor="username">Username</label>
              <input id="username" name="username" autoComplete="username" autoCapitalize="none"
                spellCheck={false} minLength={3} maxLength={24} required aria-describedby={mode === "register" ? "username-hint" : undefined} />
              {mode === "register" && <p className="field-hint" id="username-hint">Start with a letter. Use 3–24 letters, numbers, hyphens or underscores.</p>}
              <label htmlFor="password">Password</label>
              <input id="password" name="password" type="password" maxLength={64} minLength={8}
                autoComplete={mode === "register" ? "new-password" : "current-password"} required />
            </>
          )}
          {mode !== "individual" && (
            <>
              <label htmlFor="passcode">Team passcode</label>
              <input id="passcode" name="passcode" type="password"
                autoComplete={mode === "demo" ? "current-password" : "off"} maxLength={100} required />
            </>
          )}
          {error && <p className="error" role="alert">{error}</p>}
          <button className="primary-button" type="submit" disabled={pending}>
            {pending ? "Working…" : mode === "register" ? "Create account" : "Sign in"}<Icon name="arrow" size={17} />
          </button>
        </form>
      </div>
    </main>
  );
}
