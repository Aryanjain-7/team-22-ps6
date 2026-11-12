"use client";

import { useEffect, useRef, useState } from "react";
import type { AgentStep } from "@/lib/agent/types";
import { toolNames, type JobMatch } from "@/lib/careermatch-types";
import { useCareerChat } from "./ChatProvider";
import { Icon, type IconName } from "./Icon";
import { JobCard } from "./JobCard";

const prompts: { title: string; detail: string; text: string; icon: IconName }[] = [
  { title: "Find jobs in Chennai", detail: "Rank roles by my skills", text: "Find eligible jobs in Chennai and rank them by how well my skills match.", icon: "pin" },
  { title: "Explore skill gaps", detail: "Compare data analyst roles", text: "Which skills am I missing for eligible data analyst roles?", icon: "layers" },
  { title: "Find remote work", detail: "Explore eligible remote roles", text: "Show me remote jobs I’m eligible for and explain the best matches.", icon: "briefcase" },
];

function jobMatches(steps: AgentStep[]) {
  const matches = new Map<number, JobMatch>();
  for (const step of steps) {
    if (!step.ok || !step.result) continue;
    const results = step.tool === "searchJobs" ? (step.result as { matches: JobMatch[] }).matches :
      step.tool === "scoreJobMatch" ? [step.result as JobMatch] : [];
    for (const match of results) matches.set(match.job.id, match);
  }
  return [...matches.values()].sort((first, second) => second.score - first.score ||
    first.job.apply_by.localeCompare(second.job.apply_by) || first.job.id - second.job.id);
}

function Activity({ steps }: { steps: AgentStep[] }) {
  return (
    <details className="activity glass">
      <summary><Icon name="activity" size={17} />Agent activity <span>{steps.length} {steps.length === 1 ? "step" : "steps"}</span></summary>
      <ol>
        {steps.map((step, index) => {
          const outcomes = step.tool === "saveToShortlist" && step.ok
            ? (step.result as { outcomes: { saved: boolean; match?: { added: boolean } }[] }).outcomes : null;
          const added = outcomes?.filter((outcome) => outcome.match?.added).length ?? 0;
          const existing = outcomes?.filter((outcome) => outcome.saved && !outcome.match?.added).length ?? 0;
          const failed = outcomes?.filter((outcome) => !outcome.saved).length ?? 0;
          return (
            <li key={index}>
              <span>{toolNames[step.tool as keyof typeof toolNames] ?? "Tool call"}</span>
              <span className="muted">{outcomes ? [
                added ? `${added} saved` : "",
                existing ? `${existing} already saved` : "",
                failed ? `${failed} failed` : "",
              ].filter(Boolean).join(" · ") : step.ok ? "Completed" : "Failed"}</span>
            </li>
          );
        })}
      </ol>
    </details>
  );
}

export default function AgentChat() {
  const { messages, pending, error, savedIds, send } = useCareerChat();
  const [input, setInput] = useState("");
  const turnRef = useRef<HTMLDivElement>(null);
  const submit = () => {
    if (!input.trim() || pending) return;
    void send(input);
    setInput("");
  };

  useEffect(() => {
    if (!messages.length) return;
    turnRef.current?.scrollIntoView({ block: "start", behavior: "instant" });
  }, [messages, pending, error]);

  return (
    <section className="chat-page">
      <header className="chat-header">
        <h1>Job Search Chat</h1>
        <span className="assistant-label"><Icon name="spark" size={15} /> Career assistant</span>
      </header>

      {messages.length === 0 ? (
        <div className="chat-welcome">
          <div className="orb" aria-hidden="true"><Icon name="spark" size={38} /></div>
          <h2>Find your next role.</h2>
          <p>Discover jobs you’re eligible for, see how your skills match, and save the roles you want to revisit.</p>
          <div className="prompts">
            {prompts.map((prompt) => (
              <button key={prompt.title} type="button" className="surface prompt" onClick={() => void send(prompt.text)}>
                <span className="tile-icon"><Icon name={prompt.icon} size={18} /></span>
                <span className="prompt-copy"><strong>{prompt.title}</strong><span>{prompt.detail}</span></span>
                <Icon name="arrow" size={16} />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="transcript" role="log" aria-label="Conversation">
          {messages.map((message, index) => {
            const steps = message.steps ?? [];
            const matches = jobMatches(steps);
            return (
              <div className={`message message-${message.role}`} key={index}
                ref={index === messages.length - 1 ? turnRef : undefined}>
                <p className="message-author">{message.role === "user" ? "You" : "CareerMatch"}</p>
                <p className="message-text">{message.text}</p>
                {steps.length > 0 && <Activity steps={steps} />}
                {matches.length > 0 && (
                  <div className="job-grid">
                    {matches.map((match) => (
                      <JobCard key={match.job.id} job={match.job} score={match.score} skills={match} action={
                        <button type="button" className="secondary-button"
                          disabled={pending || savedIds.includes(match.job.id)}
                          aria-label={savedIds.includes(match.job.id) ? `${match.job.title} saved` : `Save ${match.job.title} at ${match.job.company} to shortlist`}
                          onClick={() => void send(`Save job #${match.job.id} (${match.job.title} at ${match.job.company}) to my shortlist.`)}>
                          <Icon name="bookmark" size={16} />{savedIds.includes(match.job.id) ? "Saved" : "Shortlist"}
                        </button>
                      } />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="composer-wrap">
        {pending && <p className="chat-status" role="status"><span className="status-dot" /> CareerMatch is working…</p>}
        {error && <p className="chat-status error" role="alert">{error}</p>}
        <form className="composer glass" onSubmit={(event) => { event.preventDefault(); submit(); }}>
          <Icon name="spark" size={22} />
          <label className="sr-only" htmlFor="message">Message CareerMatch</label>
          <textarea id="message" rows={1} maxLength={4000} placeholder="Ask about jobs, skills, or your shortlist…"
            value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault();
                submit();
              }
            }} />
          <button className="send-button" type="submit" disabled={pending || !input.trim()} aria-label="Send message">
            <Icon name="send" />
          </button>
        </form>
      </div>
    </section>
  );
}
