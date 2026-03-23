"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Agent {
  id: string;
  name: string;
  emoji: string;
  color: string;
  model: string;
  status: "online" | "offline";
  lastActivity?: string;
}

interface Activity {
  id: string;
  type: string;
  description: string;
  channel?: string;
  created_at: string;
  status: string;
}

interface Stats {
  total: number;
  today: number;
  success: number;
  error: number;
  byType: Record<string, number>;
  lastActivity?: string;
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

function calculateStardate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const start = new Date(year, 0, 1);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  const fraction = ((dayOfYear / 365) * 1000).toFixed(1);
  return `${year - 26}.${fraction}`;
}

function daysSinceLaunch(): number {
  const launch = new Date(2026, 2, 20);
  const now = new Date();
  return Math.max(0, Math.floor((now.getTime() - launch.getTime()) / (1000 * 60 * 60 * 24)));
}

const channelColors: Record<string, string> = {
  telegram: "var(--lcars-blue)",
  slack: "var(--lcars-purple)",
  imessage: "var(--lcars-green)",
  gmail: "var(--lcars-rust)",
  gateway: "var(--lcars-amber)",
};

export default function BridgePage() {
  const [stats, setStats] = useState<Stats>({ total: 0, today: 0, success: 0, error: 0, byType: {} });
  const [agents, setAgents] = useState<Agent[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [currentTime, setCurrentTime] = useState("");
  const [stardate, setStardate] = useState("");
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    Promise.all([
      fetch("/api/activities/stats").then((r) => r.json()).catch(() => ({})),
      fetch("/api/agents").then((r) => r.json()).catch(() => ({ agents: [] })),
      fetch("/api/activities?limit=5").then((r) => r.json()).catch(() => ({ activities: [] })),
    ]).then(([actStats, agentsData, activitiesData]) => {
      setStats({
        total: actStats.total || 0,
        today: actStats.today || 0,
        success: actStats.byStatus?.success || 0,
        error: actStats.byStatus?.error || 0,
        byType: actStats.byType || {},
        lastActivity: actStats.lastActivity,
      });
      setAgents(agentsData.agents || []);
      setActivities(activitiesData.activities || []);
    });
  }, []);

  useEffect(() => {
    const tick = () => {
      setCurrentTime(
        new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })
      );
      setStardate(calculateStardate());
      setElapsed(daysSinceLaunch());
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const onlineCount = agents.filter((a) => a.status === "online").length;
  const tokenUsage = Math.min(100, Math.floor(Math.random() * 60 + 20));
  const tokenSegments = 12;
  const tokenFilled = Math.round((tokenUsage / 100) * tokenSegments);

  const channels = [
    { name: "TELEGRAM", status: agents.some((a) => a.name?.toLowerCase().includes("telegram")) ? "connected" : "idle" },
    { name: "SLACK", status: "connected" },
    { name: "IMESSAGE", status: "connected" },
    { name: "GMAIL", status: "idle" },
  ];

  return (
    <div className="lcars-data-bg">
      {/* Stat row — top grid aligned */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "16px" }}>
        <div className="lcars-stat lcars-stat-amber" style={{ animation: "lcars-slide-up 0.3s ease-out 0.2s both" }}>
          <div className="lcars-stat-label">Stardate</div>
          <div className="lcars-stat-value" style={{ color: "var(--lcars-amber)" }}>{stardate}</div>
        </div>
        <div className="lcars-stat lcars-stat-blue" style={{ animation: "lcars-slide-up 0.3s ease-out 0.3s both" }}>
          <div className="lcars-stat-label">Ship Time</div>
          <div className="lcars-stat-value" style={{ color: "var(--lcars-blue)", fontFamily: "var(--font-mono)", fontWeight: 700 }}>{currentTime}</div>
        </div>
        <div className="lcars-stat lcars-stat-green" style={{ animation: "lcars-slide-up 0.3s ease-out 0.4s both" }}>
          <div className="lcars-stat-label">Mission Day</div>
          <div className="lcars-stat-value" style={{ color: "var(--lcars-green)" }}>
            {elapsed}
          </div>
        </div>
        <div className="lcars-stat lcars-stat-purple" style={{ animation: "lcars-slide-up 0.3s ease-out 0.5s both" }}>
          <div className="lcars-stat-label">Crew Online</div>
          <div className="lcars-stat-value" style={{ color: onlineCount > 0 ? "var(--lcars-green)" : "var(--lcars-text-dim)" }}>
            {onlineCount}<span style={{ fontSize: "14px", color: "var(--lcars-text-dim)", marginLeft: "4px" }}>/ {agents.length}</span>
          </div>
        </div>
      </div>

      {/* Two-column: Agent Status + Channels */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
        {/* Agent Status */}
        <div className="lcars-card lcars-card-green" style={{ animation: "lcars-slide-up 0.3s ease-out 0.5s both" }}>
          <div className="lcars-card-header">
            <span className="lcars-card-title">Agent Status</span>
            <div className="lcars-card-header-indicator lcars-blink" />
          </div>
          <div className="lcars-card-body" style={{ padding: "10px 14px" }}>
            {agents.length === 0 ? (
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--lcars-text-dim)", padding: "6px 0" }}>
                NO AGENTS DETECTED
              </div>
            ) : (
              agents.slice(0, 5).map((agent) => (
                <div key={agent.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "5px 0", borderBottom: "1px solid var(--lcars-border)" }}>
                  <span
                    className={agent.status === "online" ? "lcars-blink" : ""}
                    style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: agent.status === "online" ? "var(--lcars-green)" : "var(--lcars-text-dim)", flexShrink: 0 }}
                  />
                  <span style={{ fontFamily: "var(--font-heading)", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--lcars-text)", flex: 1 }}>
                    {agent.name}
                  </span>
                  <span style={{ fontFamily: "var(--font-heading)", fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", color: agent.status === "online" ? "var(--lcars-green)" : "var(--lcars-text-dim)" }}>
                    {agent.status === "online" ? "ONLINE" : "IDLE"}
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--lcars-text-dim)", minWidth: "45px", textAlign: "right" }}>
                    {agent.lastActivity ? timeAgo(agent.lastActivity) : "\u2014"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Channels */}
        <div className="lcars-card lcars-card-purple" style={{ animation: "lcars-slide-up 0.3s ease-out 0.6s both" }}>
          <div className="lcars-card-header">
            <span className="lcars-card-title">Active Channels</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--lcars-text-dim)" }}>
              {channels.filter((c) => c.status === "connected").length}/{channels.length}
            </span>
          </div>
          <div className="lcars-card-body" style={{ padding: "10px 14px" }}>
            {channels.map((ch) => {
              const color = channelColors[ch.name.toLowerCase()] || "var(--lcars-amber)";
              const isConnected = ch.status === "connected";
              return (
                <div key={ch.name} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "4px 0", borderBottom: "1px solid var(--lcars-border)" }}>
                  <span style={{ color: isConnected ? color : "var(--lcars-text-dim)", fontSize: "10px" }}>{"\u25C6"}</span>
                  <span style={{ fontFamily: "var(--font-heading)", fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--lcars-text)", width: "80px" }}>
                    {ch.name}
                  </span>
                  <div style={{ flex: 1, height: "6px", backgroundColor: "var(--lcars-panel-alt)", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: isConnected ? "100%" : "30%", backgroundColor: isConnected ? color : "var(--lcars-text-dim)", opacity: isConnected ? 0.7 : 0.3, borderRadius: "3px", transition: "width 1s ease" }} />
                  </div>
                  <span style={{ fontFamily: "var(--font-heading)", fontSize: "8px", letterSpacing: "0.12em", textTransform: "uppercase", color: isConnected ? color : "var(--lcars-text-dim)", minWidth: "60px", textAlign: "right" }}>
                    {ch.status === "connected" ? "CONNECTED" : "IDLE"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Two column: Crew + System Analysis */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
        {/* Crew Manifest */}
        <div className="lcars-card lcars-card-rust" style={{ animation: "lcars-slide-up 0.3s ease-out 0.7s both" }}>
          <div className="lcars-card-header">
            <span className="lcars-card-title">Crew Manifest</span>
            <Link href="/agents" style={{ fontFamily: "var(--font-heading)", fontSize: "9px", letterSpacing: "0.1em", color: "var(--lcars-amber)", textDecoration: "none", textTransform: "uppercase" }}>
              View All
            </Link>
          </div>
          <div className="lcars-card-body" style={{ padding: "10px 14px" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "10px" }}>
              <span style={{ fontFamily: "var(--font-heading)", fontSize: "24px", color: "var(--lcars-amber)", lineHeight: 1 }}>{agents.length}</span>
              <span style={{ fontFamily: "var(--font-heading)", fontSize: "9px", letterSpacing: "0.15em", color: "var(--lcars-text-dim)", textTransform: "uppercase" }}>Total</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--lcars-green)" }}>{onlineCount} online</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "6px" }}>
              {agents.slice(0, 6).map((agent) => (
                <div key={agent.id} style={{ padding: "6px 8px", backgroundColor: "var(--lcars-panel-alt)", borderRadius: "4px", borderLeft: `2px solid ${agent.color || "var(--lcars-amber)"}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <span style={{ fontSize: "12px" }}>{agent.emoji}</span>
                    <span
                      className={agent.status === "online" ? "lcars-blink" : ""}
                      style={{ width: "4px", height: "4px", borderRadius: "50%", backgroundColor: agent.status === "online" ? "var(--lcars-green)" : "var(--lcars-text-dim)", marginLeft: "auto" }}
                    />
                  </div>
                  <div style={{ fontFamily: "var(--font-heading)", fontSize: "9px", letterSpacing: "0.1em", color: "var(--lcars-text)", textTransform: "uppercase", marginTop: "3px" }}>
                    {agent.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* System Analysis */}
        <div className="lcars-card lcars-card-blue" style={{ animation: "lcars-slide-up 0.3s ease-out 0.8s both" }}>
          <div className="lcars-card-header">
            <span className="lcars-card-title">System Analysis</span>
          </div>
          <div className="lcars-card-body" style={{ padding: "10px 14px" }}>
            {[
              { label: "Messages", key: "message", color: "green" },
              { label: "Commands", key: "command", color: "purple" },
              { label: "File Ops", key: "file", color: "blue" },
              { label: "Cron", key: "cron_run", color: "rust" },
              { label: "Search", key: "search", color: "amber" },
              { label: "Security", key: "security", color: "red" },
            ].map(({ label, key, color }) => {
              const value = key === "file"
                ? (stats.byType?.file_read || 0) + (stats.byType?.file_write || 0) + (stats.byType?.file || 0)
                : stats.byType?.[key] || 0;
              const segments = 10;
              const filled = stats.total > 0 ? Math.round((value / stats.total) * segments) : 0;
              return (
                <div key={key} style={{ marginBottom: "5px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                    <span style={{ fontFamily: "var(--font-heading)", fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--lcars-text-dim)" }}>
                      {label}
                    </span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: `var(--lcars-${color})` }}>
                      {value}
                    </span>
                  </div>
                  <div className="lcars-progress">
                    {Array.from({ length: segments }).map((_, i) => (
                      <div key={i} className={`lcars-progress-segment ${i < filled ? "filled" : ""}`} style={i < filled ? { backgroundColor: `var(--lcars-${color})` } : undefined} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Token Budget */}
      <div className="lcars-card lcars-card-amber" style={{ marginBottom: "12px", animation: "lcars-slide-up 0.3s ease-out 0.85s both" }}>
        <div className="lcars-card-header">
          <span className="lcars-card-title">Token Budget</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--lcars-amber)" }}>{tokenUsage}%</span>
        </div>
        <div className="lcars-card-body" style={{ padding: "10px 14px" }}>
          <div className="lcars-progress">
            {Array.from({ length: tokenSegments }).map((_, i) => (
              <div
                key={i}
                className={`lcars-progress-segment ${i < tokenFilled ? "filled" : ""}`}
                style={i < tokenFilled ? { backgroundColor: tokenUsage > 80 ? "var(--lcars-red)" : tokenUsage > 50 ? "var(--lcars-amber)" : "var(--lcars-green)" } : undefined}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="lcars-card" style={{ marginBottom: "12px", animation: "lcars-slide-up 0.3s ease-out 0.9s both" }}>
        <div className="lcars-card-header">
          <span className="lcars-card-title">Recent Activity</span>
          <Link href="/activity" style={{ fontFamily: "var(--font-heading)", fontSize: "9px", letterSpacing: "0.1em", color: "var(--lcars-amber)", textDecoration: "none", textTransform: "uppercase" }}>
            Full Log
          </Link>
        </div>
        <div className="lcars-card-body" style={{ padding: "8px 14px" }}>
          {activities.length === 0 ? (
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--lcars-text-dim)", padding: "8px 0" }}>
              NO RECENT ACTIVITY
            </div>
          ) : (
            activities.slice(0, 5).map((act) => {
              const channelKey = (act.channel || act.type || "").toLowerCase();
              const color = channelColors[channelKey] || "var(--lcars-amber)";
              return (
                <div key={act.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "5px 0", borderBottom: "1px solid var(--lcars-border)" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--lcars-text-dim)", minWidth: "50px", flexShrink: 0 }}>
                    {timeAgo(act.created_at)}
                  </span>
                  <div style={{ width: "3px", height: "14px", borderRadius: "1px", backgroundColor: color, flexShrink: 0 }} />
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--lcars-text)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {act.description || act.type}
                  </span>
                  <span style={{ fontFamily: "var(--font-heading)", fontSize: "8px", letterSpacing: "0.1em", textTransform: "uppercase", color: act.status === "error" ? "var(--lcars-red)" : act.status === "success" ? "var(--lcars-green)" : "var(--lcars-text-dim)" }}>
                    {act.status}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Quick Nav */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "8px", animation: "lcars-slide-up 0.3s ease-out 1.0s both" }}>
        {[
          { href: "/cron", label: "Cron Jobs", color: "var(--lcars-rust)" },
          { href: "/system", label: "Engineering", color: "var(--lcars-green)" },
          { href: "/logs", label: "Comms Log", color: "var(--lcars-blue)" },
          { href: "/memory", label: "Memory Bank", color: "var(--lcars-purple)" },
          { href: "/skills", label: "R&D Lab", color: "var(--lcars-amber)" },
          { href: "/terminal", label: "Console", color: "var(--lcars-teal)" },
        ].map(({ href, label, color }) => (
          <Link
            key={href}
            href={href}
            className="lcars-btn-sweep"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 12px",
              borderRadius: "4px",
              textDecoration: "none",
              border: `1px solid ${color}`,
              backgroundColor: "transparent",
            }}
          >
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: color }} />
            <span style={{ fontFamily: "var(--font-heading)", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--lcars-text)" }}>
              {label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
