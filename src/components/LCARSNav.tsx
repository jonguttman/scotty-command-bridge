"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface NavItem {
  href: string;
  label: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "MAIN",
    items: [
      { href: "/", label: "Bridge Overview" },
      { href: "/activity", label: "Ship Log" },
    ],
  },
  {
    label: "INTELLIGENCE",
    items: [
      { href: "/rd-intel", label: "R&D Intel" },
      { href: "/memory-bay", label: "Memory Bay" },
      { href: "/memory", label: "Memory Bank" },
      { href: "/skills", label: "R&D Lab" },
    ],
  },
  {
    label: "MISSION OPS",
    items: [
      { href: "/goals", label: "Objectives" },
      { href: "/cron", label: "Cron Ops" },
      { href: "/analytics", label: "Sensors" },
    ],
  },
  {
    label: "SYSTEMS",
    items: [
      { href: "/agents", label: "Agents" },
      { href: "/files", label: "Files" },
      { href: "/terminal", label: "Terminal" },
      { href: "/system", label: "Engineering" },
      { href: "/git", label: "Helm" },
      { href: "/logs", label: "Comms" },
    ],
  },
];

interface StatusData {
  gateway: string;
  memoryCount: number;
  cronCount: number;
}

export function LCARSNav() {
  const pathname = usePathname();
  const [status, setStatus] = useState<StatusData>({
    gateway: "...",
    memoryCount: 0,
    cronCount: 0,
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
      setStatus({ gateway, memoryCount, cronCount });
    });
  }, []);

  return (
    <div className="lcars-boot-2" style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      {/* Status Panel */}
      <div className="lcars-sidebar-status">
        <div className="lcars-sidebar-status-header">System Status</div>
        <div className="lcars-sidebar-status-active">
          {status.gateway === "ONLINE" ? "ACTIVE" : "STANDBY"}
        </div>
        <div className="lcars-status-row">
          <div
            className={`lcars-status-dot ${status.gateway === "ONLINE" ? "green" : "orange"}`}
          />
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

      {/* Nav Sections */}
      {navGroups.map((group) => (
        <div key={group.label} className="lcars-nav-section">
          <div className="lcars-nav-section-label">{group.label}</div>
          {group.items.map((item, index) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`lcars-nav-item ${isActive ? "active" : ""}`}
                style={{
                  animation: `lcars-slide-in 0.3s ease-out ${0.2 + index * 0.04}s both`,
                }}
              >
                <span className="lcars-nav-dot" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </div>
  );
}
