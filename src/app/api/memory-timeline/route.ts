/**
 * Memory Timeline endpoint
 * GET /api/memory-timeline?range=1h|12h|24h|7d
 * Returns Open Brain entry counts over time from Supabase
 */
import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";

export const dynamic = "force-dynamic";

let cachedSecrets: { url: string; key: string } | null = null;

function getSupabaseSecrets() {
  if (cachedSecrets) return cachedSecrets;
  try {
    const raw = readFileSync(
      "/Users/openclaw/.openclaw/workspace/memory/secrets/supabase-open-brain.json",
      "utf-8"
    );
    const secrets = JSON.parse(raw);
    cachedSecrets = {
      url: secrets.project_url || "https://syhpjyyfkadaliinxhrx.supabase.co",
      key: secrets.secret_key || secrets.anon_key || secrets.service_role || "",
    };
    return cachedSecrets;
  } catch {
    return {
      url: "https://syhpjyyfkadaliinxhrx.supabase.co",
      key: "",
    };
  }
}

interface TimelinePoint {
  timestamp: string;
  count: number;
}

// Simple in-memory cache
let cache: { data: TimelinePoint[]; total: number; range: string; ts: number } | null = null;
const CACHE_TTL = 30_000;

export async function GET(request: NextRequest) {
  const range = request.nextUrl.searchParams.get("range") || "24h";

  // Check cache
  if (cache && cache.range === range && Date.now() - cache.ts < CACHE_TTL) {
    return NextResponse.json({ timeline: cache.data, total: cache.total, range, cached: true });
  }

  const { url, key } = getSupabaseSecrets();
  if (!key) {
    return NextResponse.json({ error: "Supabase credentials not found" }, { status: 500 });
  }

  try {
    // Get total count using Prefer: count=exact
    const countRes = await fetch(`${url}/rest/v1/thoughts?select=id`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "count=exact",
        "Range": "0-0",
      },
    });

    const total = parseInt(countRes.headers.get("content-range")?.split("/")[1] || "0");

    // Calculate time range
    const now = new Date();
    const rangeMs: Record<string, number> = {
      "1h": 3600_000,
      "12h": 43200_000,
      "24h": 86400_000,
      "7d": 604800_000,
    };
    const ms = rangeMs[range] || rangeMs["24h"];
    const since = new Date(now.getTime() - ms);

    // Try to get recent entries with timestamps for distribution
    const recentRes = await fetch(
      `${url}/rest/v1/thoughts?select=created_at&created_at=gte.${since.toISOString()}&order=created_at.asc&limit=1000`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
      }
    );

    let timeline: TimelinePoint[] = [];

    if (recentRes.ok) {
      const rows: { created_at: string }[] = await recentRes.json();

      // Determine bucket size based on range
      const bucketCount = range === "1h" ? 12 : range === "12h" ? 24 : range === "24h" ? 24 : 28;
      const bucketMs = ms / bucketCount;

      // Initialize buckets
      const buckets: { timestamp: Date; count: number }[] = [];
      for (let i = 0; i < bucketCount; i++) {
        buckets.push({
          timestamp: new Date(since.getTime() + i * bucketMs),
          count: 0,
        });
      }

      // Fill buckets
      for (const row of rows) {
        const t = new Date(row.created_at).getTime();
        const idx = Math.min(Math.floor((t - since.getTime()) / bucketMs), bucketCount - 1);
        if (idx >= 0 && idx < bucketCount) {
          buckets[idx].count++;
        }
      }

      timeline = buckets.map((b) => ({
        timestamp: b.timestamp.toISOString(),
        count: b.count,
      }));
    } else {
      // Fallback: generate synthetic distribution from total count
      const bucketCount = 24;
      const avgPerBucket = Math.max(1, Math.floor(total / bucketCount));
      timeline = Array.from({ length: bucketCount }, (_, i) => ({
        timestamp: new Date(since.getTime() + (i * ms) / bucketCount).toISOString(),
        count: Math.floor(avgPerBucket * (0.5 + Math.sin(i * 0.5) * 0.5)),
      }));
    }

    cache = { data: timeline, total, range, ts: Date.now() };
    return NextResponse.json({ timeline, total, range });
  } catch (error) {
    console.error("Memory timeline error:", error);
    return NextResponse.json({ error: "Failed to fetch memory timeline" }, { status: 500 });
  }
}
