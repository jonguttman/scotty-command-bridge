import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";

function getSupabaseConfig() {
  const raw = readFileSync(
    "/Users/openclaw/.openclaw/workspace/memory/secrets/supabase-open-brain.json",
    "utf-8"
  );
  return JSON.parse(raw) as { url: string; key: string };
}

export async function GET(request: NextRequest) {
  try {
    const { url, key } = getSupabaseConfig();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "recent";
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const query = searchParams.get("q") || "";

    const headers = {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    };

    if (action === "search" && query) {
      // Simple text search on content
      const res = await fetch(
        `${url}/rest/v1/thoughts?content=ilike.*${encodeURIComponent(query)}*&order=created_at.desc&limit=${limit}`,
        { headers }
      );
      if (!res.ok) throw new Error(`Supabase error: ${res.status}`);
      const thoughts = await res.json();
      return NextResponse.json({ thoughts, count: thoughts.length });
    }

    if (action === "stats") {
      const res = await fetch(
        `${url}/rest/v1/thoughts?select=id&limit=10000`,
        { headers, method: "HEAD" }
      );
      // Try to get count from content-range header
      const countRes = await fetch(
        `${url}/rest/v1/thoughts?select=id`,
        {
          headers: { ...headers, Prefer: "count=exact", Range: "0-0" },
        }
      );
      const range = countRes.headers.get("content-range");
      const total = range ? parseInt(range.split("/")[1] || "0", 10) : 0;

      const lastRes = await fetch(
        `${url}/rest/v1/thoughts?order=created_at.desc&limit=1`,
        { headers }
      );
      const lastArr = await lastRes.json();
      const lastUpdated = lastArr?.[0]?.created_at || null;

      return NextResponse.json({ total, lastUpdated });
    }

    // Default: recent thoughts
    const res = await fetch(
      `${url}/rest/v1/thoughts?order=created_at.desc&limit=${limit}`,
      { headers }
    );
    if (!res.ok) throw new Error(`Supabase error: ${res.status}`);
    const thoughts = await res.json();
    return NextResponse.json({ thoughts });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url, key } = getSupabaseConfig();
    const body = await request.json();
    const content = body.content;

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const res = await fetch(`${url}/rest/v1/thoughts`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({ content, created_at: new Date().toISOString() }),
    });

    if (!res.ok) throw new Error(`Supabase error: ${res.status}`);
    const thought = await res.json();
    return NextResponse.json({ thought: thought[0] || thought });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
