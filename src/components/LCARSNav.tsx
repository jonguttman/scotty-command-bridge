"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  badge?: string;
}

const mainNav: NavItem[] = [
  { href: "/", label: "Dashboard", icon: "fas fa-tachometer-alt" },
  { href: "/activity", label: "Query Log", icon: "fas fa-list" },
];

const groupNav: NavItem[] = [
  { href: "/agents", label: "Groups", icon: "fas fa-robot", badge: "1" },
  { href: "/analytics", label: "Clients", icon: "fas fa-flask", badge: "0" },
  { href: "/memory", label: "Domains", icon: "fas fa-brain", badge: "0|0" },
  { href: "/cron", label: "Lists", icon: "fas fa-clock", badge: "1" },
];

const systemNav: NavItem[] = [
  { href: "/system", label: "Engineering", icon: "fas fa-bullseye" },
  { href: "/terminal", label: "Terminal", icon: "fas fa-terminal" },
  { href: "/logs", label: "Comms", icon: "fas fa-satellite-dish" },
  { href: "/git", label: "Helm", icon: "fas fa-compass" },
  { href: "/files", label: "Files", icon: "fas fa-folder" },
];

interface StatusData {
  gateway: string;
  memoryCount: number;
  cronCount: number;
}

interface ChannelStatus {
  status: "online" | "offline" | "degraded" | "unknown";
  lastCheck: string;
  detail?: string;
}

export function LCARSNav() {
  const pathname = usePathname();
  const [status, setStatus] = useState<StatusData>({
    gateway: "...",
    memoryCount: 0,
    cronCount: 0,
  });
  const [comms, setComms] = useState<Record<string, ChannelStatus>>({});

  useEffect(() => {
    Promise.all([
      fetch("/api/health")
        .then((r) => (r.ok ? "ONLINE" : "OFFLINE"))
        .catch(() => "OFFLINE"),
      fetch("/api/activities/stats")
        .then((r) => r.json())
        .then((d) => d.total || 0)
        .catch(() => 0),
      fetch("/api/cron")
        .then((r) => r.json())
        .then((d) => (Array.isArray(d) ? d : d.jobs || d.crons || []).length)
        .catch(() => 0),
    ]).then(([gateway, memoryCount, cronCount]) => {
      setStatus({ gateway, memoryCount, cronCount });
    });
  }, []);

  // Comms status polling
  useEffect(() => {
    const load = () => {
      fetch("/api/comms-status")
        .then((r) => r.json())
        .then((d) => { if (!d.error) setComms(d); })
        .catch(() => {});
    };
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, []);

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  const renderNavItems = (items: NavItem[]) =>
    items.map((item) => (
      <Link
        key={item.href}
        href={item.href}
        className={`nav-item-link ${isActive(item.href) ? "active" : ""}`}
      >
        <i className={item.icon} style={{ width: "16px", fontSize: "12px", color: "var(--text-dim)", textAlign: "center" }} />
        <span>{item.label}</span>
        {item.badge && <span className="nav-badge">{item.badge}</span>}
      </Link>
    ));

  const isOnline = status.gateway === "ONLINE";

  const channels = [
    { key: "telegram", label: "TG", color: "#4499cc" },
    { key: "slack", label: "SL", color: "#9966cc" },
    { key: "imessage", label: "IM", color: "#00cc66" },
    { key: "gmail", label: "GM", color: "#cc4400" },
  ];

  return (
    <nav style={{ display: "flex", flexDirection: "column", flex: 1, height: "100%" }}>
      {/* Status Panel */}
      <div className="status-panel">
        <div className="status-panel-id">COMMS STATUS</div>
        <div className={isOnline ? "status-active-bar" : "status-standby-bar"}>
          {isOnline ? "ACTIVE" : "STANDBY"}
        </div>
        <div className="status-row">
          <span className={`status-dot ${isOnline ? "green" : "orange"}`} />
          <span className="status-label">GATEWAY</span>
          <span className="status-value">{isOnline ? "ONLINE" : "OFFLINE"}</span>
        </div>
        <div className="status-row">
          <span className="status-dot blue" />
          <span className="status-label">MEMORY</span>
          <span className="status-value">{status.memoryCount}</span>
        </div>
        <div className="status-row">
          <span className="status-dot blue" />
          <span className="status-label">CRON JOBS</span>
          <span className="status-value">{status.cronCount}</span>
        </div>
        {/* Channel status dots */}
        <div style={{ display: "flex", gap: "0.3rem", padding: "0.5rem 0.8rem 0.4rem", flexWrap: "wrap" }}>
          {channels.map((ch) => {
            const s = comms[ch.key];
            const up = s?.status === "online";
            const degraded = s?.status === "degraded";
            return (
              <div
                key={ch.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                  fontSize: "0.85rem",
                  fontFamily: "var(--font-mono)",
                  color: "rgba(0,0,0,0.6)",
                }}
                title={`${ch.label}: ${s?.status || "unknown"}${s?.detail ? ` — ${s.detail}` : ""}`}
              >
                <span
                  style={{
                    width: "0.5rem",
                    height: "0.5rem",
                    borderRadius: "50%",
                    background: up ? ch.color : degraded ? "#d4690a" : "var(--danger)",
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontWeight: 600 }}>{ch.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Navigation */}
      <div className="nav-section">
        <div className="nav-section-header">Main</div>
        <div className="nav-panel">
          {renderNavItems(mainNav)}
        </div>
      </div>

      {/* Group Management */}
      <div className="nav-section">
        <div className="nav-section-header">Group Management</div>
        <div className="nav-panel">
          {renderNavItems(groupNav)}
        </div>
      </div>

      {/* Systems */}
      <div className="nav-section">
        <div className="nav-section-header">Systems</div>
        <div className="nav-panel">
          {renderNavItems(systemNav)}
        </div>
      </div>
    </nav>
  );
}
