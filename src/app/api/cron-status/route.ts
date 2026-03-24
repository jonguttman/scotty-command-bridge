/**
 * Cron Status endpoint
 * GET /api/cron-status
 * Returns all cron jobs with next run countdowns
 */
import { NextResponse } from "next/server";
import { execSync } from "child_process";

export const dynamic = "force-dynamic";

interface CronJob {
  id: string;
  name: string;
  schedule: string;
  nextRun: string | null;
  lastRun: string | null;
  status: "active" | "paused" | "error";
  countdown: number | null; // ms until next run
}

// Cache
let cache: { data: CronJob[]; ts: number } | null = null;
const CACHE_TTL = 15_000;

export async function GET() {
  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    // Recalculate countdowns from cached nextRun times
    const now = Date.now();
    const refreshed = cache.data.map((j) => ({
      ...j,
      countdown: j.nextRun ? Math.max(0, new Date(j.nextRun).getTime() - now) : null,
    }));
    return NextResponse.json({ jobs: refreshed, cached: true });
  }

  try {
    const output = execSync(
      "openclaw cron list --json --all 2>/dev/null || echo '[]'",
      { timeout: 10000, encoding: "utf-8" }
    );

    let raw: { jobs?: Record<string, unknown>[] } | Record<string, unknown>[];
    try {
      raw = JSON.parse(output);
    } catch {
      raw = [];
    }

    const jobsArray = Array.isArray(raw) ? raw : (raw.jobs || []);
    const now = Date.now();

    const jobs: CronJob[] = jobsArray.map((job: Record<string, unknown>) => {
      const state = (job.state || {}) as Record<string, unknown>;
      const schedule = job.schedule as Record<string, unknown> | undefined;
      const enabled = job.enabled !== false;
      const nextRunMs = state.nextRunAtMs as number | undefined;
      const lastRunMs = state.lastRunAtMs as number | undefined;

      let scheduleDisplay = "";
      if (schedule) {
        if (schedule.kind === "cron") {
          scheduleDisplay = `${schedule.expr}${schedule.tz ? ` (${schedule.tz})` : ""}`;
        } else if (schedule.kind === "every") {
          const ms = schedule.everyMs as number;
          if (ms >= 3600000) scheduleDisplay = `Every ${ms / 3600000}h`;
          else if (ms >= 60000) scheduleDisplay = `Every ${ms / 60000}m`;
          else scheduleDisplay = `Every ${ms / 1000}s`;
        } else if (schedule.kind === "at") {
          scheduleDisplay = `Once at ${schedule.at}`;
        }
      }

      return {
        id: (job.id as string) || "",
        name: (job.name as string) || formatJobName(job),
        schedule: scheduleDisplay,
        nextRun: nextRunMs ? new Date(nextRunMs).toISOString() : null,
        lastRun: lastRunMs ? new Date(lastRunMs).toISOString() : null,
        status: enabled ? "active" : "paused",
        countdown: nextRunMs ? Math.max(0, nextRunMs - now) : null,
      };
    });

    cache = { data: jobs, ts: Date.now() };
    return NextResponse.json({ jobs });
  } catch (error) {
    console.error("Cron status error:", error);
    return NextResponse.json({ error: "Failed to fetch cron status" }, { status: 500 });
  }
}

function formatJobName(job: Record<string, unknown>): string {
  const payload = job.payload as Record<string, unknown> | undefined;
  if (!payload) return "Unnamed Job";
  if (payload.kind === "agentTurn") {
    const msg = (payload.message as string) || "";
    return msg.length > 40 ? msg.substring(0, 40) + "..." : msg || "Agent Turn";
  }
  if (payload.kind === "systemEvent") {
    const text = (payload.text as string) || "";
    return text.length > 40 ? text.substring(0, 40) + "..." : text || "System Event";
  }
  return "Unnamed Job";
}
