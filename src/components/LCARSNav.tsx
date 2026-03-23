"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Bridge", color: "var(--lcars-amber)" },
  { href: "/activity", label: "Ship Log", color: "var(--lcars-blue)" },
  { href: "/memory", label: "Memory", color: "var(--lcars-green)" },
  { href: "/cron", label: "Crons", color: "var(--lcars-purple)" },
  { href: "/agents", label: "Crew", color: "var(--lcars-amber)" },
  { href: "/skills", label: "R&D Lab", color: "var(--lcars-blue)" },
  { href: "/system", label: "Eng.", color: "var(--lcars-rust)" },
  { href: "/files", label: "Archives", color: "var(--lcars-purple)" },
  { href: "/logs", label: "Comms", color: "var(--lcars-green)" },
  { href: "/analytics", label: "Sensors", color: "var(--lcars-blue)" },
  { href: "/terminal", label: "Console", color: "var(--lcars-amber)" },
  { href: "/git", label: "Helm", color: "var(--lcars-rust)" },
];

export function LCARSNav() {
  const pathname = usePathname();

  return (
    <nav className="lcars-nav lcars-boot-2" style={{ height: "100%" }}>
      {/* Top elbow connector */}
      <div
        style={{
          width: "100%",
          height: "60px",
          backgroundColor: "var(--lcars-amber)",
          borderRadius: "0 0 40px 0",
          position: "relative",
          flexShrink: 0,
        }}
      >
        {/* Inner cutout to create the elbow effect */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: "calc(100% - 40px)",
            height: "20px",
            backgroundColor: "var(--lcars-black)",
            borderRadius: "0 20px 0 0",
          }}
        />
      </div>

      {/* Vertical amber strip + nav items */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Vertical bar */}
        <div
          style={{
            width: "40px",
            backgroundColor: "var(--lcars-amber)",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* The vertical bar continues, with color segments */}
          <div style={{ flex: 1, backgroundColor: "var(--lcars-amber)" }} />
          <div style={{ height: "40px", backgroundColor: "var(--lcars-rust)" }} />
          <div style={{ height: "30px", backgroundColor: "var(--lcars-purple)" }} />
          <div style={{ height: "20px", backgroundColor: "var(--lcars-blue-dark)" }} />
        </div>

        {/* Nav items area */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "2px",
            padding: "12px 0",
            overflowY: "auto",
          }}
        >
          {navItems.map((item, index) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`lcars-nav-item ${isActive ? "active" : ""}`}
                style={{
                  animationDelay: `${0.3 + index * 0.05}s`,
                  animation: `lcars-slide-in 0.4s ease-out ${0.3 + index * 0.05}s both`,
                }}
              >
                <span
                  className="lcars-nav-dot"
                  style={{
                    backgroundColor: isActive ? "var(--lcars-white)" : item.color,
                    opacity: isActive ? 1 : 0.6,
                  }}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom elbow connector */}
      <div
        style={{
          width: "100%",
          height: "50px",
          backgroundColor: "var(--lcars-blue-dark)",
          borderRadius: "0 40px 0 0",
          position: "relative",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "calc(100% - 40px)",
            height: "20px",
            backgroundColor: "var(--lcars-black)",
            borderRadius: "0 0 0 20px",
          }}
        />
      </div>
    </nav>
  );
}
