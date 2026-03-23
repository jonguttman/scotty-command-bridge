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

function daysSinceLaunch(): number {
  const launch = new Date(2026, 2, 20);
  const now = new Date();
  return Math.max(0, Math.floor((now.getTime() - launch.getTime()) / (1000 * 60 * 60 * 24)));
}

export default function BridgePage() {
  const [stats, setStats] = useState<Stats>({ total: 0, today: 0, success: 0, error: 0, byType: {} });
  const [agents, setAgents] = useState<Agent[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
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
    setElapsed(daysSinceLaunch());
  }, []);

  const onlineCount = agents.filter((a) => a.status === "online").length;
  const cronCount = Object.values(stats.byType).reduce((a, b) => a + b, 0);

  const channels = [
    { name: "TELEGRAM", connected: agents.some((a) => a.name?.toLowerCase().includes("telegram")), color: "#4499cc" },
    { name: "SLACK", connected: true, color: "#9966cc" },
    { name: "IMESSAGE", connected: true, color: "#00cc66" },
    { name: "GMAIL", connected: false, color: "#cc4400" },
  ];

  return (
    <div className="lcars-data-bg">
      {/* Stat Grid — 4 cards */}
      <div className="lcars-stat-grid" style={{ animation: "lcars-slide-up 0.3s ease-out 0.2s both" }}>
        <div className="lcars-stat-card rust-accent">
          <div className="lcars-stat-label">Active Sessions</div>
          <div className="lcars-stat-value">{onlineCount}</div>
          <div className="lcars-stat-sub">{agents.length} total agents</div>
        </div>
        <div className="lcars-stat-card">
          <div className="lcars-stat-label">Memory Entries</div>
          <div className="lcars-stat-value" style={{ color: "#4499cc" }}>{stats.total}</div>
          <div className="lcars-stat-sub">{stats.today} today</div>
        </div>
        <div className="lcars-stat-card">
          <div className="lcars-stat-label">Scheduled Tasks</div>
          <div className="lcars-stat-value" style={{ color: "#ff6600" }}>{cronCount}</div>
          <div className="lcars-stat-sub">activity entries</div>
        </div>
        <div className="lcars-stat-card">
          <div className="lcars-stat-label">Mission Uptime</div>
          <div className="lcars-stat-value" style={{ color: "#00cc66" }}>{elapsed}</div>
          <div className="lcars-stat-sub">days since launch</div>
        </div>
      </div>

      {/* Two columns: Agent Status + Channel Status */}
      <div className="lcars-grid-2" style={{ marginBottom: 10, animation: "lcars-slide-up 0.3s ease-out 0.4s both" }}>
        {/* Agent Status Panel */}
        <div className="lcars-panel">
          <div className="lcars-panel-header">
            <span className="lcars-panel-title">Agent Status</span>
            <span className="lcars-panel-badge">{onlineCount}/{agents.length} ONLINE</span>
          </div>
          <div className="lcars-panel-body">
            {agents.length === 0 ? (
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#556677", padding: "6px 0" }}>
                NO AGENTS DETECTED
              </div>
            ) : (
              agents.slice(0, 6).map((agent) => (
                <div key={agent.id} className="lcars-data-row">
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      backgroundColor: agent.status === "online" ? "#00cc66" : "#556677",
                      flexShrink: 0,
                    }}
                    className={agent.status === "online" ? "lcars-blink" : ""}
                  />
                  <span className="lcars-data-key" style={{ color: "#aabbcc" }}>
                    {agent.emoji} {agent.name}
                  </span>
                  <span
                    className={`lcars-data-badge ${agent.status === "online" ? "online" : "idle"}`}
                  >
                    {agent.status === "online" ? "ONLINE" : "IDLE"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Channel Status Panel */}
        <div className="lcars-panel">
          <div className="lcars-panel-header">
            <span className="lcars-panel-title">Channel Status</span>
            <span className="lcars-panel-badge">
              {channels.filter((c) => c.connected).length}/{channels.length} ACTIVE
            </span>
          </div>
          <div className="lcars-panel-body">
            {channels.map((ch) => (
              <div key={ch.name} className="lcars-data-row">
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    backgroundColor: ch.connected ? ch.color : "#556677",
                    flexShrink: 0,
                  }}
                />
                <span className="lcars-data-key" style={{ color: "#aabbcc" }}>
                  {ch.name}
                </span>
                <span
                  className={`lcars-data-badge ${ch.connected ? "online" : "offline"}`}
                >
                  {ch.connected ? "CONNECTED" : "OFFLINE"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="lcars-panel" style={{ animation: "lcars-slide-up 0.3s ease-out 0.6s both" }}>
        <div className="lcars-panel-header">
          <span className="lcars-panel-title">Recent Activity</span>
          <Link
            href="/activity"
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: 8,
              letterSpacing: "0.1em",
              color: "#ff6600",
              textDecoration: "none",
              textTransform: "uppercase",
            }}
          >
            Full Log
          </Link>
        </div>
        <div className="lcars-panel-body">
          {activities.length === 0 ? (
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#556677", padding: "6px 0" }}>
              NO RECENT ACTIVITY
            </div>
          ) : (
            activities.slice(0, 5).map((act) => (
              <div key={act.id} className="lcars-data-row">
                <span className="lcars-data-val" style={{ minWidth: 50, fontSize: 9, color: "#556677" }}>
                  {timeAgo(act.created_at)}
                </span>
                <div
                  style={{
                    width: 3,
                    height: 14,
                    borderRadius: 1,
                    backgroundColor:
                      act.status === "error" ? "#cc2200" :
                      act.status === "success" ? "#00cc66" : "#ff6600",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    color: "#aabbcc",
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {act.description || act.type}
                </span>
                <span
                  className={`lcars-data-badge ${act.status === "error" ? "offline" : act.status === "success" ? "online" : "idle"}`}
                >
                  {act.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* System Analysis */}
      <div className="lcars-grid-2" style={{ animation: "lcars-slide-up 0.3s ease-out 0.8s both" }}>
        <div className="lcars-panel">
          <div className="lcars-panel-header">
            <span className="lcars-panel-title">System Analysis</span>
          </div>
          <div className="lcars-panel-body">
            {[
              { label: "Messages", key: "message", color: "#00cc66" },
              { label: "Commands", key: "command", color: "#9966cc" },
              { label: "File Ops", key: "file", color: "#4499cc" },
              { label: "Cron", key: "cron_run", color: "#cc4400" },
              { label: "Search", key: "search", color: "#ff9900" },
            ].map(({ label, key, color }) => {
              const value = key === "file"
                ? (stats.byType?.file_read || 0) + (stats.byType?.file_write || 0) + (stats.byType?.file || 0)
                : stats.byType?.[key] || 0;
              const segments = 10;
              const filled = stats.total > 0 ? Math.round((value / stats.total) * segments) : 0;
              return (
                <div key={key} style={{ marginBottom: 5 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ fontFamily: "var(--font-heading)", fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: "#556677" }}>
                      {label}
                    </span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color }}>
                      {value}
                    </span>
                  </div>
                  <div className="lcars-progress">
                    {Array.from({ length: segments }).map((_, i) => (
                      <div
                        key={i}
                        className={`lcars-progress-segment ${i < filled ? "filled" : ""}`}
                        style={i < filled ? { backgroundColor: color } : undefined}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Nav */}
        <div className="lcars-panel">
          <div className="lcars-panel-header">
            <span className="lcars-panel-title">Quick Access</span>
          </div>
          <div className="lcars-panel-body" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {[
              { href: "/cron", label: "Cron Ops", color: "#cc4400" },
              { href: "/system", label: "Engineering", color: "#00cc66" },
              { href: "/logs", label: "Comms Log", color: "#4499cc" },
              { href: "/memory", label: "Memory Bank", color: "#9966cc" },
              { href: "/skills", label: "R&D Lab", color: "#ff9900" },
              { href: "/terminal", label: "Terminal", color: "#33aacc" },
            ].map(({ href, label, color }) => (
              <Link
                key={href}
                href={href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "7px 10px",
                  borderRadius: 2,
                  textDecoration: "none",
                  background: "#292c36",
                  transition: "background 0.1s",
                }}
                className="lcars-btn-sweep"
              >
                <div style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: color, flexShrink: 0 }} />
                <span style={{ fontFamily: "var(--font-heading)", fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "#aabbcc" }}>
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
