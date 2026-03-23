"use client";

import { useEffect, useState } from "react";
import { ActivityFeed } from "@/components/ActivityFeed";
import Link from "next/link";

interface Stats {
  total: number;
  today: number;
  success: number;
  error: number;
  byType: Record<string, number>;
}

interface Agent {
  id: string;
  name: string;
  emoji: string;
  color: string;
  model: string;
  status: "online" | "offline";
  lastActivity?: string;
  botToken?: string;
}

function LCARSStat({
  label,
  value,
  variant = "amber",
}: {
  label: string;
  value: string;
  variant?: "amber" | "blue" | "green" | "red" | "purple";
}) {
  return (
    <div className={`lcars-stat lcars-stat-${variant}`}>
      <div className="lcars-stat-label">{label}</div>
      <div className="lcars-stat-value">{value}</div>
    </div>
  );
}

function LCARSProgressBar({
  label,
  value,
  max,
  color = "amber",
}: {
  label: string;
  value: number;
  max: number;
  color?: string;
}) {
  const segments = 10;
  const filled = max > 0 ? Math.round((value / max) * segments) : 0;

  return (
    <div style={{ marginBottom: "8px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "4px",
        }}
      >
        <span className="lcars-status-label">{label}</span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            color: `var(--lcars-${color})`,
          }}
        >
          {value}
        </span>
      </div>
      <div className="lcars-progress">
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            className={`lcars-progress-segment ${i < filled ? `filled` : ""}`}
            style={
              i < filled
                ? { backgroundColor: `var(--lcars-${color})` }
                : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}

export default function BridgePage() {
  const [stats, setStats] = useState<Stats>({
    total: 0,
    today: 0,
    success: 0,
    error: 0,
    byType: {},
  });
  const [agents, setAgents] = useState<Agent[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/activities/stats").then((r) => r.json()),
      fetch("/api/agents").then((r) => r.json()),
    ])
      .then(([actStats, agentsData]) => {
        setStats({
          total: actStats.total || 0,
          today: actStats.today || 0,
          success: actStats.byStatus?.success || 0,
          error: actStats.byStatus?.error || 0,
          byType: actStats.byType || {},
        });
        setAgents(agentsData.agents || []);
      })
      .catch(console.error);
  }, []);

  const onlineCount = agents.filter((a) => a.status === "online").length;

  return (
    <div className="lcars-data-bg">
      {/* Section Title */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            width: "8px",
            height: "32px",
            backgroundColor: "var(--lcars-amber)",
            borderRadius: "4px",
          }}
        />
        <h2
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "20px",
            fontWeight: 400,
            letterSpacing: "0.2em",
            color: "var(--lcars-text)",
            textTransform: "uppercase",
            margin: 0,
          }}
        >
          Bridge Overview
        </h2>
        <div
          style={{
            flex: 1,
            height: "2px",
            background:
              "linear-gradient(90deg, var(--lcars-amber), transparent)",
          }}
        />
      </div>

      {/* Stats Grid */}
      <div
        className="lcars-boot-5"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        <LCARSStat
          label="Total Activities"
          value={stats.total.toLocaleString()}
          variant="amber"
        />
        <LCARSStat
          label="Today"
          value={stats.today.toLocaleString()}
          variant="blue"
        />
        <LCARSStat
          label="Successful"
          value={stats.success.toLocaleString()}
          variant="green"
        />
        <LCARSStat
          label="Errors"
          value={stats.error.toLocaleString()}
          variant="red"
        />
      </div>

      {/* Two column layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px",
          marginBottom: "24px",
        }}
      >
        {/* Crew Manifest */}
        <div className="lcars-card lcars-card-blue">
          <div className="lcars-card-header">
            <span className="lcars-card-title">Crew Manifest</span>
            <Link
              href="/agents"
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "11px",
                letterSpacing: "0.1em",
                color: "var(--lcars-amber)",
                textDecoration: "none",
                textTransform: "uppercase",
              }}
            >
              View All →
            </Link>
          </div>
          <div className="lcars-card-body">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "36px",
                  fontWeight: 700,
                  color: "var(--lcars-amber)",
                  lineHeight: 1,
                }}
              >
                {agents.length}
              </div>
              <div>
                <div className="lcars-status-label">Total Agents</div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "12px",
                    color: "var(--lcars-green)",
                    marginTop: "2px",
                  }}
                >
                  {onlineCount} online
                </div>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                gap: "8px",
              }}
            >
              {agents.slice(0, 6).map((agent) => (
                <div
                  key={agent.id}
                  style={{
                    padding: "10px",
                    backgroundColor: "var(--lcars-bg)",
                    borderRadius: "8px",
                    borderLeft: `3px solid ${agent.color || "var(--lcars-amber)"}`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "4px",
                    }}
                  >
                    <span style={{ fontSize: "18px" }}>{agent.emoji}</span>
                    <div
                      className={agent.status === "online" ? "lcars-blink" : ""}
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        backgroundColor:
                          agent.status === "online"
                            ? "var(--lcars-green)"
                            : "var(--lcars-text-dim)",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontSize: "12px",
                      letterSpacing: "0.1em",
                      color: "var(--lcars-text)",
                      textTransform: "uppercase",
                    }}
                  >
                    {agent.name}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "9px",
                      color: "var(--lcars-text-dim)",
                      marginTop: "2px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {agent.model.split("/").pop()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Activity Distribution */}
        <div className="lcars-card lcars-card-purple">
          <div className="lcars-card-header">
            <span className="lcars-card-title">System Analysis</span>
          </div>
          <div className="lcars-card-body">
            <LCARSProgressBar
              label="Messages"
              value={stats.byType?.message || 0}
              max={stats.total || 1}
              color="green"
            />
            <LCARSProgressBar
              label="Commands"
              value={stats.byType?.command || 0}
              max={stats.total || 1}
              color="purple"
            />
            <LCARSProgressBar
              label="File Ops"
              value={(stats.byType?.file_read || 0) + (stats.byType?.file_write || 0) + (stats.byType?.file || 0)}
              max={stats.total || 1}
              color="blue"
            />
            <LCARSProgressBar
              label="Cron"
              value={stats.byType?.cron_run || stats.byType?.cron || 0}
              max={stats.total || 1}
              color="rust"
            />
            <LCARSProgressBar
              label="Search"
              value={stats.byType?.search || 0}
              max={stats.total || 1}
              color="amber"
            />
            <LCARSProgressBar
              label="Security"
              value={stats.byType?.security || 0}
              max={stats.total || 1}
              color="red"
            />
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="lcars-card" style={{ marginBottom: "20px" }}>
        <div className="lcars-card-header">
          <span className="lcars-card-title">Recent Ship Log</span>
          <Link
            href="/activity"
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "11px",
              letterSpacing: "0.1em",
              color: "var(--lcars-amber)",
              textDecoration: "none",
              textTransform: "uppercase",
            }}
          >
            Full Log →
          </Link>
        </div>
        <div>
          <ActivityFeed limit={6} />
        </div>
      </div>

      {/* Quick Nav */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: "8px",
        }}
      >
        {[
          { href: "/cron", label: "Cron Jobs", color: "var(--lcars-rust)" },
          { href: "/system", label: "Engineering", color: "var(--lcars-green)" },
          { href: "/logs", label: "Comms Log", color: "var(--lcars-blue)" },
          { href: "/memory", label: "Memory Bank", color: "var(--lcars-purple)" },
          { href: "/skills", label: "R&D Lab", color: "var(--lcars-amber)" },
          { href: "/terminal", label: "Console", color: "var(--lcars-blue-dark)" },
        ].map(({ href, label, color }) => (
          <Link
            key={href}
            href={href}
            className="lcars-btn-outline"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "12px 16px",
              borderRadius: "20px",
              textDecoration: "none",
              borderColor: color,
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: color,
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "12px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--lcars-text)",
              }}
            >
              {label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
