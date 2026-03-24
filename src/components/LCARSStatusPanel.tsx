"use client";

import { useEffect, useState, useRef, useCallback } from "react";

interface StatusData {
  agentStatus: "online" | "offline" | "busy";
  memoryCount: number;
  cronCount: number;
  lastActivity: string;
  tokenUsage: number;
  channels: { name: string; status: "connected" | "disconnected"; color: string }[];
}

function generateHexLine(): string {
  const chars = "0123456789ABCDEF";
  const pairs: string[] = [];
  for (let i = 0; i < 8; i++) {
    pairs.push(
      chars[Math.floor(Math.random() * 16)] +
        chars[Math.floor(Math.random() * 16)]
    );
  }
  return pairs.join(" ");
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

function formatElapsed(ms: number): string {
  const secs = Math.floor(ms / 1000);
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function LCARSStatusPanel() {
  const [status, setStatus] = useState<StatusData>({
    agentStatus: "online",
    memoryCount: 0,
    cronCount: 0,
    lastActivity: "",
    tokenUsage: 0,
    channels: [
      { name: "TELEGRAM", status: "disconnected", color: "var(--color-tertiary-hover)" },
      { name: "SLACK", status: "disconnected", color: "var(--color-purple)" },
      { name: "GATEWAY", status: "disconnected", color: "var(--color-success)" },
    ],
  });

  const [hexLines, setHexLines] = useState<string[]>([]);
  const [lastActivityDisplay, setLastActivityDisplay] = useState("N/A");
  const [missionElapsed, setMissionElapsed] = useState("00:00:00");
  const hexRef = useRef<HTMLDivElement>(null);
  const launchTime = useRef(new Date(2026, 2, 20).getTime());

  const initHex = useCallback(() => {
    const lines: string[] = [];
    for (let i = 0; i < 20; i++) {
      lines.push(generateHexLine());
    }
    return lines;
  }, []);

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
          tokenUsage: Math.min(100, Math.floor(Math.random() * 60 + 20)),
          channels: [
            { name: "TELEGRAM", status: hasTelegram ? "connected" : "disconnected", color: "var(--color-tertiary-hover)" },
            { name: "SLACK", status: "disconnected", color: "var(--color-purple)" },
            { name: "GATEWAY", status: hasGateway ? "connected" : "disconnected", color: "var(--color-success)" },
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

  useEffect(() => {
    const update = () => setLastActivityDisplay(timeAgo(status.lastActivity));
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [status.lastActivity]);

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const elapsed = Math.max(0, now - launchTime.current);
      setMissionElapsed(formatElapsed(elapsed));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setHexLines(initHex());
    const interval = setInterval(() => {
      setHexLines((prev) => {
        const next = [...prev.slice(1), generateHexLine()];
        return next;
      });
    }, 800);
    return () => clearInterval(interval);
  }, [initHex]);

  const segments = 12;
  const filledSegments = Math.round((status.tokenUsage / 100) * segments);

  return (
    <aside
      className="lcars-boot-3"
      style={{
        width: "200px",
        background: "var(--color-primary)",
        borderLeft: "var(--border-width) solid var(--color-secondary)",
        borderRadius: "0 var(--radius100) var(--radius100) 0",
        padding: "var(--gap)",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        overflowY: "auto",
        flexShrink: 0,
      }}
    >
      {/* Designation */}
      <div>
        <div style={{ fontFamily: "var(--font-family)", fontSize: "0.9rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--color-tertiary)", marginBottom: "2px" }}>
          Starfleet Designation
        </div>
        <div style={{ fontFamily: "var(--font-family)", fontSize: "1.4rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--color-quaternary)" }}>
          SCOTTY
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.9rem", color: "var(--color-tertiary)", marginTop: "2px" }}>
          NCC-1701-OC
        </div>
      </div>

      <div className="lcars-rule" />

      {/* Agent Status */}
      <div>
        <div className="lcars-status-label">Agent Status</div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
          <div
            className="lcars-blink"
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: status.agentStatus === "online" ? "var(--color-success)" : status.agentStatus === "busy" ? "var(--color-amber)" : "var(--color-danger)",
            }}
          />
          <span style={{
            fontFamily: "var(--font-family)",
            fontSize: "1.2rem",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: status.agentStatus === "online" ? "var(--color-success)" : status.agentStatus === "busy" ? "var(--color-amber)" : "var(--color-danger)",
          }}>
            {status.agentStatus}
          </span>
        </div>
      </div>

      <div className="lcars-rule" />

      {/* Activity Log */}
      <div>
        <div className="lcars-status-label">Activity Log</div>
        <div className="lcars-status-value-large" style={{ marginTop: "4px" }}>
          {status.memoryCount.toLocaleString()}
        </div>
      </div>

      {/* Mission Elapsed */}
      <div>
        <div className="lcars-status-label">Mission Elapsed</div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.4rem", fontWeight: 700, color: "var(--color-tertiary-hover)", marginTop: "4px", letterSpacing: "0.05em" }}>
          {missionElapsed}
        </div>
      </div>

      {/* Last Activity */}
      <div>
        <div className="lcars-status-label">Last Activity</div>
        <div className="lcars-status-value" style={{ marginTop: "4px" }}>
          {lastActivityDisplay}
        </div>
      </div>

      <div className="lcars-rule" />

      {/* Token Usage */}
      <div>
        <div className="lcars-status-label">Token Allocation</div>
        <div style={{ marginTop: "6px" }}>
          <div className="lcars-progress">
            {Array.from({ length: segments }).map((_, i) => (
              <div key={i} className={`lcars-progress-segment ${i < filledSegments ? "filled" : ""}`} />
            ))}
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.1rem", color: "var(--color-quaternary)", marginTop: "4px", textAlign: "right" }}>
            {status.tokenUsage}%
          </div>
        </div>
      </div>

      <div className="lcars-rule" />

      {/* Channels */}
      <div>
        <div className="lcars-status-label">Channels</div>
        <div style={{ marginTop: "6px", display: "flex", flexDirection: "column", gap: "4px" }}>
          {status.channels.map((ch) => (
            <div key={ch.name} className="lcars-channel">
              <div
                className="lcars-channel-diamond"
                style={{
                  backgroundColor: ch.status === "connected" ? ch.color : "var(--color-tertiary)",
                  opacity: ch.status === "connected" ? 1 : 0.4,
                }}
              />
              <span style={{
                fontFamily: "var(--font-family)",
                fontSize: "1rem",
                letterSpacing: "0.12em",
                color: ch.status === "connected" ? "var(--color-primary-text)" : "var(--color-tertiary)",
              }}>
                {ch.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Data Stream */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative", minHeight: "40px" }}>
        <div className="lcars-status-label" style={{ marginBottom: "4px" }}>Data Stream</div>
        <div
          ref={hexRef}
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.8rem",
            lineHeight: "1.6",
            color: "var(--color-tertiary)",
            opacity: 0.3,
            overflow: "hidden",
            maxHeight: "120px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {hexLines.map((line, i) => (
            <div key={`${i}-${line}`} style={{ transition: "opacity 0.3s ease", opacity: i < 2 ? 0.3 : i > hexLines.length - 3 ? 0.2 : 0.5 }}>
              {line}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ height: "4px", borderRadius: "2px", background: "linear-gradient(90deg, var(--color-tertiary-hover), var(--color-purple), var(--color-quaternary))", flexShrink: 0 }} />
    </aside>
  );
}
