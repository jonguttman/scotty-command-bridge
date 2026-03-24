/**
 * Comms Status endpoint
 * GET /api/comms-status
 * Returns health status of all communication channels
 */
import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";

export const dynamic = "force-dynamic";

interface ChannelStatus {
  status: "online" | "offline" | "degraded" | "unknown";
  lastCheck: string;
  detail?: string;
}

// Simple cache
let cache: { data: Record<string, ChannelStatus>; ts: number } | null = null;
const CACHE_TTL = 30_000;

function readConfig() {
  try {
    const raw = readFileSync("/Users/openclaw/.openclaw/openclaw.json", "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function checkTelegram(botToken: string): Promise<ChannelStatus> {
  const now = new Date().toISOString();
  if (!botToken) return { status: "offline", lastCheck: now, detail: "No bot token configured" };
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`https://api.telegram.org/bot${botToken}/getMe`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const data = await res.json();
    if (data.ok) {
      return { status: "online", lastCheck: now, detail: `@${data.result?.username}` };
    }
    return { status: "degraded", lastCheck: now, detail: data.description || "API error" };
  } catch {
    return { status: "offline", lastCheck: now, detail: "Connection failed" };
  }
}

async function checkSlack(botToken: string): Promise<ChannelStatus> {
  const now = new Date().toISOString();
  if (!botToken) return { status: "offline", lastCheck: now, detail: "No bot token configured" };
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch("https://slack.com/api/auth.test", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${botToken}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const data = await res.json();
    if (data.ok) {
      return { status: "online", lastCheck: now, detail: data.team || "Connected" };
    }
    return { status: "degraded", lastCheck: now, detail: data.error || "Auth failed" };
  } catch {
    return { status: "offline", lastCheck: now, detail: "Connection failed" };
  }
}

function checkIMessage(cliPath: string): ChannelStatus {
  const now = new Date().toISOString();
  if (!cliPath) return { status: "offline", lastCheck: now, detail: "No CLI path configured" };
  if (existsSync(cliPath)) {
    return { status: "online", lastCheck: now, detail: cliPath };
  }
  return { status: "offline", lastCheck: now, detail: "CLI binary not found" };
}

function checkGmail(): ChannelStatus {
  const now = new Date().toISOString();
  const oauthPath = "/Users/openclaw/.openclaw/workspace/memory/secrets/google-oauth.json";
  if (existsSync(oauthPath)) {
    try {
      const raw = readFileSync(oauthPath, "utf-8");
      const data = JSON.parse(raw);
      if (data.refresh_token) {
        return { status: "online", lastCheck: now, detail: "OAuth configured" };
      }
      return { status: "degraded", lastCheck: now, detail: "Missing refresh token" };
    } catch {
      return { status: "degraded", lastCheck: now, detail: "Invalid OAuth file" };
    }
  }
  return { status: "offline", lastCheck: now, detail: "No OAuth credentials" };
}

export async function GET() {
  // Check cache
  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    return NextResponse.json(cache.data);
  }

  const config = readConfig();
  const channels = config?.channels || {};

  const [telegram, slack] = await Promise.all([
    checkTelegram(channels.telegram?.botToken || ""),
    checkSlack(channels.slack?.botToken || ""),
  ]);

  const imessage = checkIMessage(channels.imessage?.cliPath || "");
  const gmail = checkGmail();

  const result = { telegram, slack, imessage, gmail };
  cache = { data: result, ts: Date.now() };

  return NextResponse.json(result);
}
