"use client";

import { useEffect, useRef, useState } from "react";
import type { AgentStep } from "@/lib/agent/types";
import { toolNames, type JobMatch } from "@/lib/careermatch-types";
import { useCareerChat } from "./ChatProvider";
import { Icon, type IconName } from "./Icon";
import { JobCard } from "./JobCard";
import { PageHeading } from "./PageHeading";

const prompts: { title: string; detail: string; text: string; icon: IconName; review?: true }[] = [
  { title: "Shortlist Chennai’s top 3", detail: "Rank roles by my skills", text: "Find jobs in Chennai that match my skills and save the top 3.", icon: "pin", review: true },
  { title: "Explore skill gaps", detail: "Compare data analyst roles", text: "Which skills am I missing for data analyst roles?", icon: "layers" },
  { title: "Add Docker and search again", detail: "Update my skills and rerank roles", text: "I just learned Docker, add it to my profile and search again.", icon: "plus", review: true },
  { title: "Browse internships", detail: "Compare entry-level opportunities", text: "Find internships I’m eligible for and rank them by skill match.", icon: "bookmark" },
];

const initialMatchCount = 4;

function jobMatches(steps: AgentStep[]) {
  const matches = new Map<number, JobMatch>();
  for (const step of steps) {
    if (step.tool === "updateMySkills" && step.ok) matches.clear();
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
    <details className="activity surface">
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

function PromptChoices({ onChoose }: { onChoose: (prompt: typeof prompts[number]) => void }) {
  return (
    <div className="prompts">
      {prompts.map((prompt) => (
        <button key={prompt.title} type="button" className="surface prompt" onClick={() => onChoose(prompt)}>
          <span className="tile-icon"><Icon name={prompt.icon} size={18} /></span>
          <span className="prompt-copy"><strong>{prompt.title}</strong><span>{prompt.detail}</span></span>
          <Icon name="arrow" size={16} />
        </button>
      ))}
    </div>
  );
}

function MatchResults({ matches }: { matches: JobMatch[] }) {
  const { pending, savedIds, send } = useCareerChat();
  const [showAll, setShowAll] = useState(false);
  const remaining = matches.length - initialMatchCount;

  return (
    <section className="match-results" aria-label="Job matches">
      <h2>{matches.length} {matches.length === 1 ? "job match" : "job matches"}</h2>
      <div className="job-grid">
        {matches.slice(0, showAll ? matches.length : initialMatchCount).map((match) => (
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
      {remaining > 0 && (
        <button type="button" className="secondary-button" aria-expanded={showAll} onClick={() => setShowAll(!showAll)}>
          {showAll ? "Show fewer matches" : `Show ${remaining} more ${remaining === 1 ? "match" : "matches"}`}
        </button>
      )}
    </section>
  );
}

export default function AgentChat() {
  const { messages, pending, error, send, clearConversation } = useCareerChat();
  const [input, setInput] = useState("");
  const [showPrompts, setShowPrompts] = useState(false);
  const turnRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const promptPanelRef = useRef<HTMLDivElement>(null);
  const promptToggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (showPrompts) promptPanelRef.current?.querySelector("button")?.focus({ preventScroll: true });
  }, [showPrompts]);

  function submit() {
    if (!input.trim() || pending) return;
    void send(input);
    setInput("");
    setShowPrompts(false);
  }

  function preparePrompt(text: string) {
    setInput(text);
    setShowPrompts(false);
    inputRef.current?.focus();
  }

  useEffect(() => {
    if (!messages.length) return;
    turnRef.current?.scrollIntoView({ block: "start", behavior: "instant" });
  }, [messages, pending, error]);

  return (
    <section className="chat-page" data-empty={messages.length === 0}>
      <PageHeading title="Job Search Chat" icon="chat"
        description="Find eligible roles, compare your skills, and build your shortlist."
        action={messages.length > 0 && (
          <button type="button" className="secondary-button new-chat" disabled={pending} onClick={() => {
            if (!window.confirm("Start a new chat? This will clear this conversation.")) return;
            clearConversation();
            setInput("");
            setShowPrompts(false);
            inputRef.current?.focus();
          }}><Icon name="plus" size={16} /> New chat</button>
        )}
      />

      {messages.length === 0 ? (
        <div className="surface chat-welcome">
          <div className="welcome-copy">
            <div className="orb" aria-hidden="true"><Icon name="spark" size={29} /></div>
            <h2>Find your next role.</h2>
            <p>Start with a suggested search or ask in your own words.</p>
          </div>
          <PromptChoices onChoose={({ text, review }) => {
            if (review) preparePrompt(text);
            else void send(text);
          }} />
        </div>
      ) : (
        <div className="transcript" role="log" aria-label="Conversation">
          {messages.map((message, index) => {
            const steps = message.steps ?? [];
            const matches = jobMatches(steps);
            const longResultReply = matches.length > 0 &&
              (message.text.length > 320 || message.text.split("\n").length > 5);
            return (
              <div className={`message message-${message.role}`} key={index}
                ref={index === messages.length - 1 ? turnRef : undefined}>
                <p className="message-author">{message.role === "user" ? "You" : "CareerMatch"}</p>
                {!longResultReply && <p className="message-text">{message.text}</p>}
                {(longResultReply || steps.length > 0) && (
                  <div className="message-tools">
                    {longResultReply && (
                      <details className="reply-details surface">
                        <summary>Read assistant reply</summary>
                        <p className="reply-text">{message.text}</p>
                      </details>
                    )}
                    {steps.length > 0 && <Activity steps={steps} />}
                  </div>
                )}
                {matches.length > 0 && <MatchResults matches={matches} />}
              </div>
            );
          })}
        </div>
      )}

      <div className="composer-wrap" onKeyDown={(event) => {
        if (event.key === "Escape" && showPrompts) {
          setShowPrompts(false);
          promptToggleRef.current?.focus();
        }
      }}>
        {showPrompts && (
          <div id="composer-prompts" ref={promptPanelRef} className="surface composer-prompts">
            <PromptChoices onChoose={({ text }) => preparePrompt(text)} />
          </div>
        )}
        {pending && <p className="chat-status" role="status"><span className="status-dot" /> CareerMatch is working…</p>}
        {error && <p className="chat-status error" role="alert">{error}</p>}
        <form className="composer glass" onSubmit={(event) => { event.preventDefault(); submit(); }}>
          {messages.length > 0 ? (
            <button type="button" ref={promptToggleRef} className="menu-action prompt-toggle" aria-label="Suggested prompts" aria-expanded={showPrompts}
              aria-controls={showPrompts ? "composer-prompts" : undefined} onClick={() => setShowPrompts(!showPrompts)}>
              <Icon name="spark" size={19} />
            </button>
          ) : <span className="composer-icon"><Icon name="spark" size={21} /></span>}
          <label className="sr-only" htmlFor="message">Message CareerMatch</label>
          <textarea id="message" ref={inputRef} rows={1} maxLength={4000} placeholder="Ask about jobs, skills, or your shortlist…"
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
