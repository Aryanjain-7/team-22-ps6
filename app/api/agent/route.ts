import { NextResponse } from "next/server";
import { agentRequestSchema } from "@/lib/schemas";
import { runAgent } from "@/lib/agent/runAgent";

export const runtime = "nodejs";
export const maxDuration = 60;

/** POST /api/agent  body: { messages: [{ role: "user" | "model", text: string }] } */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = agentRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.issues }, { status: 400 });
  }

  try {
    const result = await runAgent(parsed.data.messages);
    return NextResponse.json({
      ...result,
      steps: result.steps.map((step) => ({
        tool: step.tool, ok: step.ok, writes: step.writes,
        args: {},
        result: ["searchJobs", "scoreJobMatch", "saveToShortlist"].includes(step.tool) && step.ok
          ? step.result : undefined,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Agent failed";
    const status = err && typeof err === "object" && "status" in err ? Number(err.status) : 0;
    const quota = status === 429 || /quota|RESOURCE_EXHAUSTED/i.test(message);
    const busy = status === 503 || /high demand|UNAVAILABLE/i.test(message);
    const timeout = err instanceof Error && /TimeoutError|AbortError/.test(err.name);
    const missingConfig = /Missing environment variable/i.test(message);
    console.error("[agent] Request failed", { upstreamStatus: status || null, quota, busy, timeout, missingConfig });
    const error = quota ? "Gemini quota reached. Wait a minute and try again."
      : busy ? "Gemini is busy right now. Try again in a moment."
      : timeout ? "Gemini took too long to respond. Try a shorter request."
      : missingConfig ? "The job search agent has not been configured. Check the server settings."
      : "CareerMatch could not complete this request. Try again shortly.";
    return NextResponse.json({ error }, { status: quota ? 429 : busy ? 503 : timeout ? 504 : 500 });
  }
}
