"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

/* ── Types ────────────────────────────────────────────── */

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

interface TimelinePoint {
  timestamp: string;
  count: number;
}

interface ChannelStatus {
  status: "online" | "offline" | "degraded" | "unknown";
  lastCheck: string;
  detail?: string;
}

interface CronJob {
  id: string;
  name: string;
  schedule: string;
  nextRun: string | null;
  lastRun: string | null;
  status: "active" | "paused" | "error";
  countdown: number | null;
}

interface ServiceStatus {
  status: "up" | "down";
  responseTime: number;
  detail?: string;
}

/* ── Helpers ──────────────────────────────────────────── */

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

function formatCountdown(ms: number | null): string {
  if (ms === null || ms <= 0) return "—";
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rs = s % 60;
  if (m < 60) return `${m}m ${rs}s`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return `${h}h ${rm}m`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

type TimeRange = "1h" | "12h" | "24h" | "7d";

/* ── Component ────────────────────────────────────────── */

export default function BridgePage() {
  const [stats, setStats] = useState<Stats>({ total: 0, today: 0, success: 0, error: 0, byType: {} });
  const [agents, setAgents] = useState<Agent[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  // Memory timeline
  const [memoryRange, setMemoryRange] = useState<TimeRange>("24h");
  const [memoryTimeline, setMemoryTimeline] = useState<TimelinePoint[]>([]);
  const [memoryTotal, setMemoryTotal] = useState(0);
  const [memoryLoading, setMemoryLoading] = useState(true);

  // Comms status
  const [comms, setComms] = useState<Record<string, ChannelStatus>>({});
  const [commsLoading, setCommsLoading] = useState(true);

  // Cron status
  const [cronJobs, setCronJobs] = useState<CronJob[]>([]);
  const [cronLoading, setCronLoading] = useState(true);

  // Service health
  const [services, setServices] = useState<Record<string, ServiceStatus>>({});
  const [servicesLoading, setServicesLoading] = useState(true);

  // Countdown tick
  const [, setTick] = useState(0);

  /* ── Fetchers ─────────────────────────────────────── */

  // Core stats + agents + activities
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

  // Memory timeline
  const fetchMemory = useCallback((range: TimeRange) => {
    setMemoryLoading(true);
    fetch(`/api/memory-timeline?range=${range}`)
      .then((r) => r.json())
      .then((d) => {
        setMemoryTimeline(d.timeline || []);
        setMemoryTotal(d.total || 0);
      })
      .catch(() => {
        setMemoryTimeline([]);
        setMemoryTotal(0);
      })
      .finally(() => setMemoryLoading(false));
  }, []);

  useEffect(() => { fetchMemory(memoryRange); }, [memoryRange, fetchMemory]);

  // Comms status (poll every 60s)
  useEffect(() => {
    const load = () => {
      fetch("/api/comms-status")
        .then((r) => r.json())
        .then((d) => { if (!d.error) setComms(d); })
        .catch(() => {})
        .finally(() => setCommsLoading(false));
    };
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, []);

  // Cron status
  useEffect(() => {
    const load = () => {
      fetch("/api/cron-status")
        .then((r) => r.json())
        .then((d) => setCronJobs(d.jobs || []))
        .catch(() => {})
        .finally(() => setCronLoading(false));
    };
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, []);

  // Service health
  useEffect(() => {
    const load = () => {
      fetch("/api/service-health")
        .then((r) => r.json())
        .then((d) => { if (!d.error) setServices(d); })
        .catch(() => {})
        .finally(() => setServicesLoading(false));
    };
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, []);

  // Countdown tick (every 1s)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  /* ── Derived ──────────────────────────────────────── */

  const onlineCount = agents.filter((a) => a.status === "online").length;
  const maxMemoryCount = Math.max(1, ...memoryTimeline.map((p) => p.count));

  const commsChannels = [
    { key: "telegram", name: "TELEGRAM", color: "#4499cc" },
    { key: "slack", name: "SLACK", color: "#9966cc" },
    { key: "imessage", name: "IMESSAGE", color: "#00cc66" },
    { key: "gmail", name: "GMAIL", color: "#cc4400" },
  ];

  const serviceList = [
    { key: "weedmenu", label: "WEED.MENU" },
    { key: "gateway", label: "GATEWAY" },
    { key: "openBrain", label: "OPEN BRAIN" },
  ];

  /* ── Render ───────────────────────────────────────── */

  const timeRanges: TimeRange[] = ["1h", "12h", "24h", "7d"];

  return (
    <div>
      {/* ── STAT GRID ─────────────────────────────────── */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-card-label">Active Sessions</div>
          <div className="stat-card-value">{agents.length === 0 ? "—" : onlineCount}</div>
          <div className="stat-card-icon">⊕</div>
          <Link href="/agents" className="stat-card-footer">VIEW ALL SESSIONS →</Link>
        </div>

        <div className="stat-card highlighted">
          <div className="stat-card-label">Errors Today</div>
          <div className="stat-card-value">{stats.error}</div>
          <div className="stat-card-icon">⊘</div>
          <Link href="/files" className="stat-card-footer">VIEW ERROR LOG →</Link>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">Memory Entries</div>
          <div className="stat-card-value">{memoryTotal || stats.total}</div>
          <div className="stat-card-icon">◎</div>
          <Link href="/memory-bay" className="stat-card-footer">SEARCH MEMORY BAY →</Link>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">Cron Jobs</div>
          <div className="stat-card-value">{cronJobs.length || Object.keys(stats.byType).length}</div>
          <div className="stat-card-icon">⏱</div>
          <Link href="/crons" className="stat-card-footer">VIEW SCHEDULE →</Link>
        </div>
      </div>

      {/* ── SERVICE HEALTH BADGES ─────────────────────── */}
      <div className="service-health-row">
        {servicesLoading ? (
          <span className="pulse-text">CHECKING SERVICES...</span>
        ) : (
          serviceList.map(({ key, label }) => {
            const svc = services[key];
            const up = svc?.status === "up";
            return (
              <div key={key} className="service-badge">
                <span className="status-dot" style={{ width: 6, height: 6, background: up ? "var(--success)" : "var(--danger)" }} />
                <span className="service-badge-label">{label}</span>
                {svc && up && <span className="service-badge-time">{svc.responseTime}ms</span>}
                {svc && !up && <span className="service-badge-down">DOWN</span>}
              </div>
            );
          })
        )}
      </div>

      {/* ── ORANGE DIVIDER ──────────────────────────── */}
      <div style={{ height: "0.4rem", background: "linear-gradient(90deg, transparent 0%, #915e4d 20%, #d4690a 50%, #915e4d 80%, transparent 100%)", margin: "0 0 var(--gap) 0" }} />

      {/* ── MEMORY USAGE — OPEN BRAIN ─────────────────── */}
      <div className="content-panel">
        <div className="content-panel-header">
          <span className="content-panel-title">Memory Usage — Open Brain</span>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div className="time-filter-tabs">
              {timeRanges.map((r) => (
                <button
                  key={r}
                  className={`time-filter-tab ${memoryRange === r ? "active" : ""}`}
                  onClick={() => setMemoryRange(r)}
                >
                  {r.toUpperCase()}
                </button>
              ))}
            </div>
            <span className="content-panel-badge">{memoryTotal} entries</span>
          </div>
        </div>
        <div className="content-panel-body" style={{ paddingRight: 40 }}>
          {memoryLoading ? (
            <div className="chart-loading">
              <div className="pulse-text">LOADING MEMORY DATA...</div>
            </div>
          ) : (
            <div style={{ display: "flex", gap: "0.4rem" }}>
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "0 0.4rem", fontSize: "0.9rem", fontFamily: "var(--font-mono)", color: "var(--hover)", textAlign: "right", minWidth: "2.5rem" }}>
                <span>{maxMemoryCount}</span>
                <span>{Math.round(maxMemoryCount * 0.75)}</span>
                <span>{Math.round(maxMemoryCount * 0.5)}</span>
                <span>{Math.round(maxMemoryCount * 0.25)}</span>
                <span>0</span>
              </div>
              <div style={{ flex: 1, position: "relative" }}>
                <div className="chart-area">
                  {memoryTimeline.map((p, i) => (
                    <div
                      key={i}
                      className="chart-bar"
                      style={{
                        height: `${Math.max(2, (p.count / maxMemoryCount) * 100)}%`,
                        flex: 1,
                        background: "linear-gradient(to top, #d4690a, #915e4d)",
                        opacity: 0.85,
                        borderRadius: "1px 1px 0 0",
                      }}
                      title={`${formatTime(p.timestamp)}: ${p.count} entries`}
                    />
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 3rem 0 0", fontSize: "0.9rem", color: "var(--hover)", fontFamily: "var(--font-mono)" }}>
                  {memoryTimeline.length > 0 && (
                    <>
                      <span>{formatTime(memoryTimeline[0].timestamp)}</span>
                      <span>{formatTime(memoryTimeline[Math.floor(memoryTimeline.length / 2)]?.timestamp || memoryTimeline[0].timestamp)}</span>
                      <span>{formatTime(memoryTimeline[memoryTimeline.length - 1].timestamp)}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
          <div className="edge-label"><span>Open-Brain</span></div>
        </div>
      </div>

      {/* ── TOKEN USAGE — BY AGENT & MODEL ────────────── */}
      <div className="content-panel">
        <div className="content-panel-header">
          <span className="content-panel-title">Token Usage — By Agent & Model</span>
          <span className="content-panel-badge">{agents.length} agents</span>
        </div>
        <div className="content-panel-body" style={{ paddingRight: 40 }}>
          <div style={{ display: "flex", gap: "0.4rem" }}>
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "0 0.4rem", fontSize: "0.9rem", fontFamily: "var(--font-mono)", color: "var(--hover)", textAlign: "right", minWidth: "2rem" }}>
              <span>100k</span>
              <span>75k</span>
              <span>50k</span>
              <span>25k</span>
              <span>0</span>
            </div>
            <div style={{ flex: 1, position: "relative" }}>
              <div className="chart-area" style={{ height: 140 }}>
                {Array.from({ length: 24 }, (_, i) => {
                  const sonnet = 30 + Math.sin(i * 0.8) * 20 + Math.cos(i * 0.3) * 10;
                  const opus = 15 + Math.cos(i * 0.6) * 10;
                  const qwen = 8 + Math.sin(i * 1.2) * 5;
                  const total = sonnet + opus + qwen;
                  return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%" }}>
                      <div style={{ height: `${(qwen / total) * (total / 80) * 100}%`, background: "#33aacc", opacity: 0.85, minHeight: "1px" }} title={`Qwen: ${Math.round(qwen)}k`} />
                      <div style={{ height: `${(opus / total) * (total / 80) * 100}%`, background: "#9966cc", opacity: 0.85, minHeight: "1px" }} title={`Opus: ${Math.round(opus)}k`} />
                      <div style={{ height: `${(sonnet / total) * (total / 80) * 100}%`, background: "#d4690a", opacity: 0.85, borderRadius: "1px 1px 0 0", minHeight: "1px" }} title={`Sonnet: ${Math.round(sonnet)}k`} />
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 3rem 0 0", fontSize: "0.9rem", color: "var(--hover)", fontFamily: "var(--font-mono)" }}>
                {["00:00", "06:00", "12:00", "18:00", "23:00"].map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
            </div>
          </div>
          {/* Legend */}
          <div style={{ display: "flex", gap: "1.6rem", marginTop: "0.8rem", fontSize: "0.9rem" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span style={{ width: 8, height: 8, background: "#d4690a", borderRadius: 1 }} /> <span style={{ color: "var(--hover)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Sonnet</span>
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span style={{ width: 8, height: 8, background: "#9966cc", borderRadius: 1 }} /> <span style={{ color: "var(--hover)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Opus</span>
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span style={{ width: 8, height: 8, background: "#33aacc", borderRadius: 1 }} /> <span style={{ color: "var(--hover)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Qwen</span>
            </span>
          </div>
          <div className="edge-label"><span>Tokens</span></div>
        </div>
      </div>

      {/* ── TWO COLUMNS: Agents + Comms Status ────────── */}
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
                  <span className="status-dot" style={{ width: 6, height: 6, background: agent.status === "online" ? "var(--green)" : "var(--text-dim)" }} />
                  <span className="data-label">{agent.emoji} {agent.name}</span>
                  <span className={`data-badge ${agent.status === "online" ? "online" : "idle"}`}>
                    {agent.status === "online" ? "ONLINE" : "IDLE"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Comms Status (LIVE) */}
        <div className="content-panel">
          <div className="content-panel-header">
            <span className="content-panel-title">Comms Status</span>
            <span className="content-panel-badge">
              {commsLoading ? "..." : `${commsChannels.filter((c) => comms[c.key]?.status === "online").length}/${commsChannels.length} active`}
            </span>
          </div>
          <div className="content-panel-body">
            {commsLoading ? (
              <div className="pulse-text" style={{ padding: "12px 0", textAlign: "center" }}>CHECKING CHANNELS...</div>
            ) : (
              commsChannels.map((ch) => {
                const s = comms[ch.key];
                const isUp = s?.status === "online";
                const isDegraded = s?.status === "degraded";
                return (
                  <div key={ch.key} className="data-row">
                    <span
                      className="status-dot"
                      style={{
                        width: 6,
                        height: 6,
                        background: isUp ? ch.color : isDegraded ? "#d4690a" : "var(--danger)",
                      }}
                    />
                    <span className="data-label">{ch.name}</span>
                    {s?.detail && (
                      <span style={{ fontSize: "0.85rem", color: "var(--hover)", fontFamily: "var(--font-mono)", marginRight: "auto", paddingLeft: "0.4rem" }}>
                        {s.detail}
                      </span>
                    )}
                    <span className={`data-badge ${isUp ? "connected" : isDegraded ? "idle" : "offline"}`}>
                      {isUp ? "ONLINE" : isDegraded ? "DEGRADED" : "OFFLINE"}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── SCHEDULED OPERATIONS ──────────────────────── */}
      <div className="content-panel">
        <div className="content-panel-header">
          <span className="content-panel-title">Scheduled Operations</span>
          <Link href="/cron" className="content-panel-link">All Crons</Link>
        </div>
        <div className="content-panel-body">
          {cronLoading ? (
            <div className="pulse-text" style={{ padding: "12px 0", textAlign: "center" }}>LOADING CRON JOBS...</div>
          ) : cronJobs.length === 0 ? (
            <div style={{ fontSize: 11, color: "var(--text-dim)", padding: "6px 0", fontFamily: "var(--font-mono)", textAlign: "center", letterSpacing: "0.15em" }}>
              NO CRON JOBS CONFIGURED
            </div>
          ) : (
            <div>
              {/* Table header */}
              <div className="cron-table-header">
                <span style={{ flex: 2 }}>NAME</span>
                <span style={{ flex: 1.5 }}>SCHEDULE</span>
                <span style={{ flex: 1 }}>NEXT RUN</span>
                <span style={{ flex: 1 }}>LAST RUN</span>
                <span style={{ flex: 0.6, textAlign: "right" }}>STATUS</span>
              </div>
              {cronJobs.slice(0, 8).map((job) => {
                const countdown = job.nextRun ? Math.max(0, new Date(job.nextRun).getTime() - Date.now()) : null;
                return (
                  <div key={job.id} className="cron-table-row">
                    <span style={{ flex: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#fff" }}>
                      {job.name}
                    </span>
                    <span style={{ flex: 1.5, fontFamily: "var(--font-mono)", fontSize: "0.9rem" }}>
                      {job.schedule}
                    </span>
                    <span style={{ flex: 1, fontFamily: "var(--font-mono)", fontSize: "0.9rem", color: countdown !== null && countdown < 300_000 ? "#d4690a" : "var(--panel-text)" }}>
                      {formatCountdown(countdown)}
                    </span>
                    <span style={{ flex: 1, fontSize: "0.9rem", color: "var(--hover)" }}>
                      {job.lastRun ? timeAgo(job.lastRun) : "—"}
                    </span>
                    <span style={{ flex: 0.6, textAlign: "right" }}>
                      <span className={`data-badge ${job.status === "active" ? "online" : job.status === "paused" ? "idle" : "error"}`}>
                        {job.status.toUpperCase()}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
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
                      <div key={i} className={`progress-segment ${i < filled ? "filled" : ""}`} style={i < filled ? { background: color } : undefined} />
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
