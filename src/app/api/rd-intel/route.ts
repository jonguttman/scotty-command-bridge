import { NextResponse } from "next/server";
import { readFileSync } from "fs";

function getSlackBotToken(): string {
  const raw = readFileSync(
    "/Users/openclaw/.openclaw/openclaw.json",
    "utf-8"
  );
  const config = JSON.parse(raw);
  return config.channels?.slack?.botToken;
}

export async function GET() {
  try {
    const token = getSlackBotToken();
    if (!token) {
      return NextResponse.json(
        { error: "Slack bot token not configured" },
        { status: 500 }
      );
    }

    const channelId = "C0ANGT8HXDF"; // #rd-briefs

    // Fetch last 10 messages
    const res = await fetch(
      `https://slack.com/api/conversations.history?channel=${channelId}&limit=10`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!res.ok) throw new Error(`Slack API error: ${res.status}`);
    const data = await res.json();

    if (!data.ok) {
      return NextResponse.json(
        { error: data.error || "Slack API error" },
        { status: 500 }
      );
    }

    // Get permalinks for each message
    const briefs = await Promise.all(
      (data.messages || []).map(async (msg: { text?: string; ts?: string }) => {
        let permalink = "";
        try {
          const plRes = await fetch(
            `https://slack.com/api/chat.getPermalink?channel=${channelId}&message_ts=${msg.ts}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const plData = await plRes.json();
          permalink = plData.permalink || "";
        } catch {
          // Skip permalink on failure
        }

        return {
          text: msg.text || "",
          timestamp: msg.ts
            ? new Date(parseFloat(msg.ts) * 1000).toISOString()
            : null,
          permalink,
        };
      })
    );

    return NextResponse.json({ briefs });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
