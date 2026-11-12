"use client";

import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import type { AgentResult, AgentStep } from "@/lib/agent/types";
import type { ChatMessage } from "@/lib/schemas";

export type Message = ChatMessage & { steps?: AgentStep[] };
const ChatContext = createContext<{
  messages: Message[];
  pending: boolean;
  error: string;
  savedIds: number[];
  profileRevision: number;
  shortlistRevision: number;
  send: (text: string) => Promise<void>;
  clearConversation: () => void;
} | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const [profileRevision, setProfileRevision] = useState(0);
  const [shortlistRevision, setShortlistRevision] = useState(0);
  const inFlight = useRef(false);

  async function send(input: string) {
    const text = input.trim();
    if (!text || inFlight.current) return;
    const next: Message[] = [...messages, { role: "user", text }];
    inFlight.current = true;
    setMessages(next);
    setPending(true);
    setError("");
    try {
      const recent = next.slice(-20);
      if (recent[0]?.role === "model") recent.shift();
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: recent.map(({ role, text }) => ({ role, text: text.slice(0, 4000) })) }),
      });
      const data = await response.json();
      if (response.status === 401) {
        window.location.assign("/login");
        return;
      }
      if (!response.ok) throw new Error(data.error ?? "Could not reach the job search agent.");
      const { reply, steps } = data as AgentResult;
      setMessages([...next, { role: "model", text: reply, steps }]);
      const saved = steps.flatMap((step) => {
        if (step.tool !== "saveToShortlist" || !step.ok) return [];
        const result = step.result as { outcomes: { jobId: number; saved: boolean }[] };
        return result.outcomes.filter((outcome) => outcome.saved).map((outcome) => outcome.jobId);
      });
      if (saved.length) {
        setSavedIds((ids) => [...new Set([...ids, ...saved])]);
        setShortlistRevision((value) => value + 1);
      }
      if (steps.some((step) => step.tool === "updateMySkills" && step.ok)) {
        setProfileRevision((value) => value + 1);
      }
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not reach the job search agent.");
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }

  function clearConversation() {
    if (inFlight.current) return;
    setMessages([]);
    setError("");
  }

  return <ChatContext.Provider value={{
    messages, pending, error, savedIds, profileRevision, shortlistRevision, send, clearConversation,
  }}>{children}</ChatContext.Provider>;
}

export function useCareerChat() {
  const context = useContext(ChatContext);
  if (!context) throw new Error("CareerMatch pages require the workspace layout.");
  return context;
}
