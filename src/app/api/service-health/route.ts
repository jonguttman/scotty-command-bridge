/**
 * Service Health endpoint
 * GET /api/service-health
 * Returns health of external services with response times
 */
import { NextResponse } from "next/server";
import { readFileSync } from "fs";

export const dynamic = "force-dynamic";

interface ServiceStatus {
  status: "up" | "down";
  responseTime: number;
  detail?: string;
}

// Cache
let cache: { data: Record<string, ServiceStatus>; ts: number } | null = null;
const CACHE_TTL = 30_000;

async function pingService(
  url: string,
  timeoutMs = 5000,
  headers?: Record<string, string>
): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, { signal: controller.signal, headers });
    clearTimeout(timeout);
    const responseTime = Date.now() - start;
    return {
      status: res.ok || res.status < 500 ? "up" : "down",
      responseTime,
      detail: `HTTP ${res.status}`,
    };
  } catch {
    return { status: "down", responseTime: Date.now() - start, detail: "Connection failed" };
  }
}

function getGatewayAuth(): { port: number; token: string } {
  try {
    const raw = readFileSync("/Users/openclaw/.openclaw/openclaw.json", "utf-8");
    const config = JSON.parse(raw);
    return {
      port: config.gateway?.port || 18789,
      token: config.gateway?.auth?.token || "",
    };
  } catch {
    return { port: 18789, token: "" };
  }
}

function getSupabaseUrl(): string {
  try {
    const raw = readFileSync(
      "/Users/openclaw/.openclaw/workspace/memory/secrets/supabase-open-brain.json",
      "utf-8"
    );
    const secrets = JSON.parse(raw);
    return secrets.project_url || "https://syhpjyyfkadaliinxhrx.supabase.co";
  } catch {
    return "https://syhpjyyfkadaliinxhrx.supabase.co";
  }
}

export async function GET() {
  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    return NextResponse.json(cache.data);
  }

  const gw = getGatewayAuth();
  const supabaseUrl = getSupabaseUrl();

  const [weedmenu, gateway, openBrain] = await Promise.all([
    pingService("https://www.weed.menu/api/health"),
    pingService(`http://127.0.0.1:${gw.port}`, 3000, {
      Authorization: `Bearer ${gw.token}`,
    }),
    pingService(`${supabaseUrl}/rest/v1/`, 5000),
  ]);

  const result = { weedmenu, gateway, openBrain };
  cache = { data: result, ts: Date.now() };

  return NextResponse.json(result);
}
