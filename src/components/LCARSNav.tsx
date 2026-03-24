"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface NavItem {
  href: string;
  label: string;
  badge?: string;
}

const mainNav: NavItem[] = [
  { href: "/", label: "Dashboard" },
  { href: "/activity", label: "Query Log" },
];

const groupNav: NavItem[] = [
  { href: "/agents", label: "Groups", badge: "1" },
  { href: "/analytics", label: "Clients", badge: "0" },
  { href: "/memory", label: "Domains", badge: "0|0" },
  { href: "/cron", label: "Lists", badge: "1" },
];

const systemNav: NavItem[] = [
  { href: "/system", label: "Engineering" },
  { href: "/terminal", label: "Terminal" },
  { href: "/logs", label: "Comms" },
  { href: "/git", label: "Helm" },
  { href: "/files", label: "Files" },
];

interface StatusData {
  gateway: string;
  memoryCount: number;
  cronCount: number;
  load: string;
  memoryPct: string;
}

export function LCARSNav() {
  const pathname = usePathname();
  const [status, setStatus] = useState<StatusData>({
    gateway: "...",
    memoryCount: 0,
    cronCount: 0,
    load: "0.00",
    memoryPct: "0.0",
  });

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
        .then((d) => (d.jobs || d.crons || []).length)
        .catch(() => 0),
    ]).then(([gateway, memoryCount, cronCount]) => {
      setStatus((prev) => ({
        ...prev,
        gateway,
        memoryCount,
        cronCount,
        load: "0.33 0.28 0.25",
        memoryPct: "9.1",
      }));
    });
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
        <span className="nav-item-icon" />
        <span>{item.label}</span>
        {item.badge && <span className="nav-badge">{item.badge}</span>}
      </Link>
    ));

  const isOnline = status.gateway === "ONLINE";

  return (
    <nav style={{ display: "flex", flexDirection: "column", flex: 1, height: "100%" }}>
      {/* Status Panel */}
      <div className="status-panel">
        <div className="status-panel-header">STATUS_PANEL-47A</div>
        <div className={isOnline ? "status-active-bar" : "status-standby-bar"}>
          {isOnline ? "ACTIVE" : "STANDBY"}
        </div>
        <div className="status-row">
          <div className={`status-dot ${isOnline ? "green" : "orange"}`} />
          <span className="status-label">Q/Min</span>
          <span className="status-value">0.00</span>
        </div>
        <div className="status-row">
          <div className="status-dot blue" />
          <span className="status-label">Load</span>
          <span className="status-value">{status.load}</span>
        </div>
        <div className="status-row">
          <div className="status-dot teal" />
          <span className="status-label">Memory</span>
          <span className="status-value">{status.memoryPct}%</span>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="nav-section">
        <div className="nav-section-header">Main</div>
        {renderNavItems(mainNav)}
      </div>

      {/* Group Management */}
      <div className="nav-section">
        <div className="nav-section-header">Group Management</div>
        {renderNavItems(groupNav)}
      </div>

      {/* Systems */}
      <div className="nav-section">
        <div className="nav-section-header">Systems</div>
        {renderNavItems(systemNav)}
      </div>
    </nav>
  );
}
