"use client";

import { useEffect, useState, useRef } from "react";

interface StatusData {
  agentStatus: "online" | "offline" | "busy";
  memoryCount: number;
  cronCount: number;
  lastActivity: string;
  tokenUsage: number; // 0-100
  channels: { name: string; status: "connected" | "disconnected"; color: string }[];
}

function generateHexStream(length: number): string {
  const chars = "0123456789ABCDEF";
  let result = "";
  for (let i = 0; i < length; i++) {
    if (i > 0 && i % 2 === 0) result += " ";
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return "N/A";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function LCARSStatusPanel() {
  const [status, setStatus] = useState<StatusData>({
    agentStatus: "online",
    memoryCount: 0,
    cronCount: 0,
    lastActivity: "",
    tokenUsage: 0,
    channels: [
      { name: "TELEGRAM", status: "disconnected", color: "var(--lcars-blue)" },
      { name: "SLACK", status: "disconnected", color: "var(--lcars-purple)" },
      { name: "GATEWAY", status: "disconnected", color: "var(--lcars-green)" },
    ],
  });

  const [hexStream, setHexStream] = useState("");
  const [lastActivityDisplay, setLastActivityDisplay] = useState("N/A");
  const hexRef = useRef<HTMLDivElement>(null);

  // Fetch status data
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const [statsRes, agentsRes] = await Promise.all([
          fetch("/api/activities/stats").catch(() => null),
          fetch("/api/agents").catch(() => null),
        ]);

        const stats = statsRes?.ok ? await statsRes.json() : null;
        const agentsData = agentsRes?.ok ? await agentsRes.json() : null;

        const agents = agentsData?.agents || [];
        const onlineAgents = agents.filter((a: { status: string }) => a.status === "online");
        const hasGateway = agents.length > 0;
        const hasTelegram = agents.some((a: { botToken?: string }) => a.botToken);

        setStatus((prev) => ({
          ...prev,
          agentStatus: onlineAgents.length > 0 ? "online" : "offline",
          memoryCount: stats?.total || 0,
          cronCount: stats?.byType?.cron_run || stats?.byType?.cron || 0,
          lastActivity: stats?.lastActivity || "",
          tokenUsage: Math.min(100, Math.floor(Math.random() * 60 + 20)), // Simulated for now
          channels: [
            {
              name: "TELEGRAM",
              status: hasTelegram ? "connected" : "disconnected",
              color: "var(--lcars-blue)",
            },
            {
              name: "SLACK",
              status: "disconnected",
              color: "var(--lcars-purple)",
            },
            {
              name: "GATEWAY",
              status: hasGateway ? "connected" : "disconnected",
              color: "var(--lcars-green)",
            },
          ],
        }));
      } catch {
        // silently fail
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Update "last activity" display every 30s
  useEffect(() => {
    const update = () => setLastActivityDisplay(timeAgo(status.lastActivity));
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [status.lastActivity]);

  // Generate scrolling hex data stream
  useEffect(() => {
    setHexStream(generateHexStream(400));
    const interval = setInterval(() => {
      setHexStream(generateHexStream(400));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const segments = 12;
  const filledSegments = Math.round((status.tokenUsage / 100) * segments);

  return (
    <aside className="lcars-status-panel lcars-boot-3" style={{ height: "100%" }}>
      {/* Agent Status */}
      <div>
        <div className="lcars-status-label">Agent Status</div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
          <div
            className="lcars-blink"
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              backgroundColor:
                status.agentStatus === "online"
                  ? "var(--lcars-green)"
                  : status.agentStatus === "busy"
                  ? "var(--lcars-amber)"
                  : "var(--lcars-red)",
            }}
          />
          <span
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "14px",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color:
                status.agentStatus === "online"
                  ? "var(--lcars-green)"
                  : status.agentStatus === "busy"
                  ? "var(--lcars-amber)"
                  : "var(--lcars-red)",
            }}
          >
            {status.agentStatus}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div
        style={{
          height: "2px",
          background: "linear-gradient(90deg, var(--lcars-blue-dark), transparent)",
        }}
      />

      {/* Memory Count */}
      <div>
        <div className="lcars-status-label">Activity Log</div>
        <div className="lcars-status-value-large" style={{ marginTop: "4px" }}>
          {status.memoryCount.toLocaleString()}
        </div>
      </div>

      {/* Cron Count */}
      <div>
        <div className="lcars-status-label">Cron Runs</div>
        <div className="lcars-status-value" style={{ marginTop: "4px" }}>
          {status.cronCount}
        </div>
      </div>

      {/* Last Activity */}
      <div>
        <div className="lcars-status-label">Last Activity</div>
        <div
          className="lcars-status-value"
          style={{ marginTop: "4px", color: "var(--lcars-blue)" }}
        >
          {lastActivityDisplay}
        </div>
      </div>

      {/* Divider */}
      <div
        style={{
          height: "2px",
          background: "linear-gradient(90deg, var(--lcars-amber), transparent)",
        }}
      />

      {/* Token Usage */}
      <div>
        <div className="lcars-status-label">Token Allocation</div>
        <div style={{ marginTop: "8px" }}>
          <div className="lcars-progress">
            {Array.from({ length: segments }).map((_, i) => (
              <div
                key={i}
                className={`lcars-progress-segment ${i < filledSegments ? "filled" : ""}`}
              />
            ))}
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              color: "var(--lcars-amber)",
              marginTop: "4px",
              textAlign: "right",
            }}
          >
            {status.tokenUsage}%
          </div>
        </div>
      </div>

      {/* Divider */}
      <div
        style={{
          height: "2px",
          background: "linear-gradient(90deg, var(--lcars-purple), transparent)",
        }}
      />

      {/* Channels */}
      <div>
        <div className="lcars-status-label">Channels</div>
        <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "4px" }}>
          {status.channels.map((ch) => (
            <div key={ch.name} className="lcars-channel">
              <div
                className="lcars-channel-diamond"
                style={{
                  backgroundColor:
                    ch.status === "connected" ? ch.color : "var(--lcars-text-dim)",
                  opacity: ch.status === "connected" ? 1 : 0.4,
                }}
              />
              <span
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "12px",
                  letterSpacing: "0.12em",
                  color:
                    ch.status === "connected" ? "var(--lcars-text)" : "var(--lcars-text-dim)",
                }}
              >
                {ch.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Data Stream */}
      <div
        style={{
          flex: 1,
          overflow: "hidden",
          position: "relative",
          minHeight: "60px",
        }}
      >
        <div className="lcars-status-label" style={{ marginBottom: "6px" }}>
          Data Stream
        </div>
        <div
          ref={hexRef}
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "9px",
            lineHeight: "1.5",
            color: "var(--lcars-text-dim)",
            opacity: 0.3,
            wordBreak: "break-all",
            overflow: "hidden",
            maxHeight: "120px",
          }}
        >
          {hexStream}
        </div>
      </div>

      {/* Bottom decorative bar */}
      <div
        style={{
          height: "8px",
          borderRadius: "4px",
          background: "linear-gradient(90deg, var(--lcars-blue-dark), var(--lcars-purple), var(--lcars-amber))",
          flexShrink: 0,
        }}
      />
    </aside>
  );
}
