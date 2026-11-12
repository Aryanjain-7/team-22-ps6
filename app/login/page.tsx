"use client";

import { useState, type FormEvent } from "react";
import { Icon } from "@/components/Icon";

export default function LoginPage() {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      if (response.ok) {
        window.location.assign("/");
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
      <form className="surface login-card" onSubmit={handleSubmit}>
        <div className="brand">
          <span className="brand-mark"><Icon name="spark" size={19} /></span>
          <span>Career<span className="brand-accent">Match</span></span>
        </div>
        <h1>Welcome to CareerMatch</h1>
        <p className="muted">Enter your team passcode to open the workspace.</p>
        <label htmlFor="passcode">Team passcode</label>
        <input id="passcode" type="password" value={passcode} autoComplete="current-password"
          onChange={(event) => setPasscode(event.target.value)} required />
        {error && <p className="error" role="alert">{error}</p>}
        <button className="primary-button" type="submit" disabled={pending || !passcode}>
          {pending ? "Signing in…" : "Sign in"}<Icon name="arrow" size={17} />
        </button>
      </form>
    </main>
  );
}
