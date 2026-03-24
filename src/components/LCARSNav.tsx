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
        <i className={item.icon} style={{width:'16px', fontSize:'12px', color:'var(--text-dim)', textAlign:'center'}} />
        <span>{item.label}</span>
        {item.badge && <span className="nav-badge">{item.badge}</span>}
      </Link>
    ));

  const isOnline = status.gateway === "ONLINE";

  return (
    <nav style={{ display: "flex", flexDirection: "column", flex: 1, height: "100%" }}>
      {/* Status Panel */}
      <div className="status-panel">
        <div style={{display:'flex', gap:'1.2rem', padding:'1.2rem 1rem'}}>
          <div style={{fontSize:'4rem', lineHeight:1}}>🦞</div>
          <div style={{flex:1}}>
            <div className="status-panel-id">SCOTTY</div>
            <div style={{fontSize:'1rem', textTransform:'uppercase', letterSpacing:'0.08em'}}>
              <div className="status-row"><span className={`status-dot ${isOnline ? "green" : "orange"}`}/><span className="status-label">GATEWAY</span><span className="status-value">{isOnline ? "ONLINE" : "OFFLINE"}</span></div>
              <div className="status-row"><span className="status-dot blue"/><span className="status-label">MEMORY</span><span className="status-value">{status.memoryCount}</span></div>
              <div className="status-row"><span className="status-dot blue"/><span className="status-label">CRON JOBS</span><span className="status-value">{status.cronCount}</span></div>
            </div>
          </div>
        </div>
        <div className={isOnline ? "status-active-bar" : "status-standby-bar"}>
          {isOnline ? "ACTIVE" : "STANDBY"}
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
