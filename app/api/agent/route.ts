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
    console.error("[agent]", message);
    const quota = /429|quota|RESOURCE_EXHAUSTED/i.test(message);
    return NextResponse.json(
      {
        error: quota
          ? "Gemini quota reached. Wait a minute and try again."
          : /Missing environment variable/i.test(message)
            ? "The job search agent has not been configured. Check the server settings."
            : "CareerMatch could not complete this request. Try again shortly.",
      },
      { status: quota ? 429 : 500 }
    );
  }
}
