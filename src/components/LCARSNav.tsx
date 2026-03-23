"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  badge?: number;
}

const mainNav: NavItem[] = [
  { href: "/", label: "Bridge", icon: "⌂" },
  { href: "/activity", label: "Ship Log", icon: "▣" },
  { href: "/rd-intel", label: "R&D Intel", icon: "◈" },
  { href: "/memory-bay", label: "Memory Bay", icon: "◎" },
  { href: "/memory", label: "Memory Bank", icon: "⬡" },
  { href: "/skills", label: "R&D Lab", icon: "⚗" },
  { href: "/goals", label: "Objectives", icon: "≡" },
  { href: "/cron", label: "Cron Ops", icon: "⏱" },
  { href: "/analytics", label: "Sensors", icon: "◉" },
];

const systemNav: NavItem[] = [
  { href: "/agents", label: "Agents", icon: "⚙" },
  { href: "/files", label: "Files", icon: "▤" },
  { href: "/terminal", label: "Terminal", icon: "▶" },
  { href: "/system", label: "Engineering", icon: "⚡" },
  { href: "/git", label: "Helm", icon: "⎈" },
  { href: "/logs", label: "Comms", icon: "⊞" },
];

interface StatusData {
  gateway: string;
  memoryCount: number;
  cronCount: number;
  cpuLoad: string;
  memoryPct: string;
}

export function LCARSNav() {
  const pathname = usePathname();
  const [time, setTime] = useState("");
  const [status, setStatus] = useState<StatusData>({
    gateway: "...",
    memoryCount: 0,
    cronCount: 0,
    cpuLoad: "0.00",
    memoryPct: "0%",
  });

  useEffect(() => {
    const updateTime = () => {
      setTime(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

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
      setStatus((prev) => ({ ...prev, gateway, memoryCount, cronCount }));
    });
  }, []);

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <div className="lcars-boot-2" style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      {/* Rounded title bar */}
      <div className="lcars-titlebar">
        <span className="lcars-titlebar-title">SCOTTY CMD BRIDGE</span>
        <span className="lcars-titlebar-time">{time}</span>
      </div>

      {/* Color stripes */}
      <div className="lcars-stripe-row">
        <div className="lcars-stripe-purple" />
        <div className="lcars-stripe-amber" />
      </div>

      {/* Status panel — golden amber */}
      <div className="lcars-sidebar-status">
        <div className="lcars-status-header-row">STATUS-47C</div>
        <div className={status.gateway === "ONLINE" ? "lcars-status-active-row" : "lcars-status-standby-row"}>
          {status.gateway === "ONLINE" ? "ACTIVE" : "STANDBY"}
        </div>
        <div className="lcars-status-row">
          <div className={`lcars-status-dot ${status.gateway === "ONLINE" ? "green" : "orange"}`} />
          <span className="lcars-status-key">Gateway</span>
          <span className="lcars-status-val">{status.gateway}</span>
        </div>
        <div className="lcars-status-row">
          <div className="lcars-status-dot blue" />
          <span className="lcars-status-key">Entries</span>
          <span className="lcars-status-val">{status.memoryCount}</span>
        </div>
        <div className="lcars-status-row">
          <div className="lcars-status-dot orange" />
          <span className="lcars-status-key">Cron Jobs</span>
          <span className="lcars-status-val">{status.cronCount}</span>
        </div>
      </div>

      {/* Nav panel — blue */}
      <div className="lcars-nav-panel">
        {mainNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`lcars-nav-item ${isActive(item.href) ? "active" : ""}`}
          >
            <span className="lcars-nav-item-icon">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </div>

      {/* Purple panel — systems */}
      <div className="lcars-nav-panel-purple">
        {systemNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`lcars-nav-item ${isActive(item.href) ? "active" : ""}`}
          >
            <span className="lcars-nav-item-icon">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
