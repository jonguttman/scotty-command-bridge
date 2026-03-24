"use client";

import { useEffect, useState, useMemo } from "react";
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

interface Stats {
  total: number;
  today: number;
  success: number;
  error: number;
  byType: Record<string, number>;
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

  useEffect(() => { setElapsed(daysSinceLaunch()); }, []);

  const onlineCount = agents.filter((a) => a.status === "online").length;

  // Generate pseudo-random chart bars
  const chartBars = useMemo(() =>
    Array.from({ length: 24 }, (_, i) => {
      const h = Math.sin(i * 0.7 + 2) * 40 + Math.cos(i * 1.3) * 20 + 50;
      return Math.max(5, Math.min(95, Math.round(h)));
    }), []);

  const clientBars = useMemo(() =>
    Array.from({ length: 24 }, (_, i) => {
      const h = Math.cos(i * 0.5 + 1) * 30 + Math.sin(i * 1.1) * 15 + 35;
      return Math.max(3, Math.min(80, Math.round(h)));
    }), []);

  const channels = [
    { name: "TELEGRAM", connected: agents.some((a) => a.name?.toLowerCase().includes("telegram")), color: "#4499cc" },
    { name: "SLACK", connected: true, color: "#9966cc" },
    { name: "IMESSAGE", connected: true, color: "#00cc66" },
    { name: "GMAIL", connected: true, color: "#cc4400" },
  ];

  return (
    <div>
      {/* ── STAT GRID ─────────────────────────────────── */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-card-label">Active Sessions</div>
          <div className="stat-card-value">{agents.length === 0 ? "—" : onlineCount}</div>
          <div className="stat-card-icon">⊕</div>
          <Link href="/agents" className="stat-card-footer">
            {onlineCount} active clients →
          </Link>
        </div>

        <div className="stat-card highlighted">
          <div className="stat-card-label">Errors Today</div>
          <div className="stat-card-value">{stats.error}</div>
          <div className="stat-card-icon">⊘</div>
          <Link href="/logs" className="stat-card-footer">
            View error log →
          </Link>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">Memory Entries</div>
          <div className="stat-card-value">{stats.total}</div>
          <div className="stat-card-icon">◎</div>
          <Link href="/memory" className="stat-card-footer">
            Search memory →
          </Link>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">Cron Jobs</div>
          <div className="stat-card-value">{Object.keys(stats.byType).length}</div>
          <div className="stat-card-icon">⏱</div>
          <Link href="/cron" className="stat-card-footer">
            View schedule →
          </Link>
        </div>
      </div>

      {/* ── TOTAL QUERIES (Activity Chart) ────────────── */}
      <div className="content-panel">
        <div className="content-panel-header">
          <span className="content-panel-title">Total Queries</span>
          <span className="content-panel-badge">{stats.total} total</span>
        </div>
        <div className="content-panel-body" style={{ paddingRight: 40 }}>
          <div className="chart-area">
            {chartBars.map((h, i) => (
              <div key={i} className="chart-bar" style={{ height: `${h}%` }} />
            ))}
          </div>
          <div className="edge-label">
            <span>Queries-Over-Time</span>
          </div>
        </div>
      </div>

      {/* ── CLIENT ACTIVITY ───────────────────────────── */}
      <div className="content-panel">
        <div className="content-panel-header">
          <span className="content-panel-title">Client Activity</span>
          <span className="content-panel-badge">{agents.length} agents</span>
        </div>
        <div className="content-panel-body" style={{ paddingRight: 40 }}>
          <div className="chart-area" style={{ height: 140 }}>
            {clientBars.map((h, i) => (
              <div key={i} className="chart-bar" style={{ height: `${h}%`, background: "var(--orange)" }} />
            ))}
          </div>
          <div className="edge-label">
            <span>Clients</span>
          </div>
        </div>
      </div>

      {/* ── TWO COLUMNS: Agents + Channels ────────────── */}
      <div className="grid-2">
        {/* Agent Status */}
        <div className="content-panel">
          <div className="content-panel-header">
            <span className="content-panel-title">Agent Status</span>
            <span className="content-panel-badge">{onlineCount}/{agents.length} online</span>
          </div>
          <div className="content-panel-body">
            {agents.length === 0 ? (
              <div style={{ fontSize: 11, color: "var(--text-dim)", padding: "12px 0", textAlign: "center", letterSpacing: "0.15em", textTransform: "uppercase" }}>
                No agents detected
              </div>
            ) : (
              agents.slice(0, 6).map((agent) => (
                <div key={agent.id} className="data-row">
                  <span
                    className="status-dot"
                    style={{
                      width: 6, height: 6,
                      background: agent.status === "online" ? "var(--green)" : "var(--text-dim)",
                    }}
                  />
                  <span className="data-label">{agent.emoji} {agent.name}</span>
                  <span className={`data-badge ${agent.status === "online" ? "online" : "idle"}`}>
                    {agent.status === "online" ? "ONLINE" : "IDLE"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Channel Status */}
        <div className="content-panel">
          <div className="content-panel-header">
            <span className="content-panel-title">Channel Status</span>
            <span className="content-panel-badge">{channels.filter((c) => c.connected).length}/{channels.length} active</span>
          </div>
          <div className="content-panel-body">
            {channels.map((ch) => (
              <div key={ch.name} className="data-row">
                <span
                  className="status-dot"
                  style={{
                    width: 6, height: 6,
                    background: ch.connected ? ch.color : "var(--text-dim)",
                  }}
                />
                <span className="data-label">{ch.name}</span>
                <span className={`data-badge ${ch.connected ? "connected" : "offline"}`}>
                  {ch.connected ? "CONNECTED" : "OFFLINE"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RECENT ACTIVITY ───────────────────────────── */}
      <div className="content-panel">
        <div className="content-panel-header">
          <span className="content-panel-title">Recent Activity</span>
          <Link href="/activity" className="content-panel-link">Full Log</Link>
        </div>
        <div className="content-panel-body">
          {activities.length === 0 ? (
            <div style={{ fontSize: 11, color: "var(--text-dim)", padding: "6px 0", fontFamily: "var(--font-mono)" }}>
              NO RECENT ACTIVITY
            </div>
          ) : (
            activities.slice(0, 5).map((act) => (
              <div key={act.id} className="data-row">
                <span className="data-value" style={{ minWidth: 50, fontSize: 9, color: "var(--text-dim)" }}>
                  {timeAgo(act.created_at)}
                </span>
                <span
                  style={{
                    width: 3, height: 14, borderRadius: 1, flexShrink: 0,
                    background: act.status === "error" ? "#cc2200" : act.status === "success" ? "var(--green)" : "var(--orange)",
                  }}
                />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {act.description || act.type}
                </span>
                <span className={`data-badge ${act.status === "error" ? "error" : act.status === "success" ? "success" : "idle"}`}>
                  {act.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── SYSTEM ANALYSIS + QUICK ACCESS ────────────── */}
      <div className="grid-2">
        <div className="content-panel">
          <div className="content-panel-header">
            <span className="content-panel-title">System Analysis</span>
          </div>
          <div className="content-panel-body">
            {[
              { label: "Messages", key: "message", color: "var(--green)" },
              { label: "Commands", key: "command", color: "#9966cc" },
              { label: "File Ops", key: "file", color: "var(--blue-dot)" },
              { label: "Cron", key: "cron_run", color: "#cc4400" },
              { label: "Search", key: "search", color: "var(--orange)" },
            ].map(({ label, key, color }) => {
              const value = key === "file"
                ? (stats.byType?.file_read || 0) + (stats.byType?.file_write || 0) + (stats.byType?.file || 0)
                : stats.byType?.[key] || 0;
              const segments = 10;
              const filled = stats.total > 0 ? Math.round((value / stats.total) * segments) : 0;
              return (
                <div key={key} style={{ marginBottom: 5 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-dim)" }}>{label}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color }}>{value}</span>
                  </div>
                  <div className="progress-row">
                    {Array.from({ length: segments }).map((_, i) => (
                      <div
                        key={i}
                        className={`progress-segment ${i < filled ? "filled" : ""}`}
                        style={i < filled ? { background: color } : undefined}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="content-panel">
          <div className="content-panel-header">
            <span className="content-panel-title">Quick Access</span>
          </div>
          <div className="content-panel-body" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {[
              { href: "/cron", label: "Cron Ops", color: "#cc4400" },
              { href: "/system", label: "Engineering", color: "var(--green)" },
              { href: "/logs", label: "Comms Log", color: "var(--blue-dot)" },
              { href: "/memory", label: "Memory Bank", color: "#9966cc" },
              { href: "/skills", label: "R&D Lab", color: "var(--orange)" },
              { href: "/terminal", label: "Terminal", color: "var(--teal-dot)" },
            ].map(({ href, label, color }) => (
              <Link key={href} href={href} className="quick-btn">
                <span className="quick-btn-dot" style={{ background: color }} />
                <span className="quick-btn-label">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
