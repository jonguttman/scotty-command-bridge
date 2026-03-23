import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync, statSync } from "fs";

const GOALS_PATH = "/Users/openclaw/.openclaw/workspace/GOALS.md";

export async function GET() {
  try {
    const content = readFileSync(GOALS_PATH, "utf-8");
    const stats = statSync(GOALS_PATH);
    return NextResponse.json({
      content,
      lastSaved: stats.mtime.toISOString(),
      charCount: content.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const content = body.content;

    if (typeof content !== "string") {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    writeFileSync(GOALS_PATH, content, "utf-8");
    const stats = statSync(GOALS_PATH);
    return NextResponse.json({
      success: true,
      lastSaved: stats.mtime.toISOString(),
      charCount: content.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
