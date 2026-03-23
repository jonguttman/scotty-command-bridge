"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  dotColor?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "BRIDGE",
    items: [
      { href: "/", label: "Overview" },
      { href: "/activity", label: "Ship Log" },
      { href: "/terminal", label: "Console" },
      { href: "/goals", label: "Objectives" },
    ],
  },
  {
    label: "INTELLIGENCE",
    items: [
      { href: "/agents", label: "Crew" },
      { href: "/skills", label: "R&D Lab" },
      { href: "/rd-intel", label: "R&D Intel" },
      { href: "/analytics", label: "Sensors" },
    ],
  },
  {
    label: "MEMORY",
    items: [
      { href: "/memory", label: "Memory Bank" },
      { href: "/memory-bay", label: "Memory Bay" },
      { href: "/files", label: "Archives" },
      { href: "/logs", label: "Comms" },
    ],
  },
  {
    label: "SYSTEMS",
    items: [
      { href: "/system", label: "Engineering" },
      { href: "/cron", label: "Cron Jobs" },
      { href: "/git", label: "Helm" },
    ],
  },
];

export function LCARSNav() {
  const pathname = usePathname();

  return (
    <div className="lcars-sidebar-nav lcars-boot-2">
      {navGroups.map((group) => (
        <div key={group.label} className="lcars-nav-group">
          <div className="lcars-nav-group-label">{group.label}</div>
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
                <span
                  className="lcars-nav-dot"
                  style={
                    isActive
                      ? undefined
                      : { background: item.dotColor || "var(--lcars-text-dim)" }
                  }
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </div>
  );
}
