"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Bridge", color: "var(--lcars-amber)", group: 0 },
  { href: "/activity", label: "Ship Log", color: "var(--lcars-amber)", group: 0 },
  { href: "/memory", label: "Memory", color: "var(--lcars-rust)", group: 1 },
  { href: "/cron", label: "Crons", color: "var(--lcars-rust)", group: 1 },
  { href: "/agents", label: "Crew", color: "var(--lcars-blue)", group: 2 },
  { href: "/skills", label: "R&D Lab", color: "var(--lcars-blue)", group: 2 },
  { href: "/system", label: "Eng.", color: "var(--lcars-blue)", group: 2 },
  { href: "/files", label: "Archives", color: "var(--lcars-purple)", group: 3 },
  { href: "/logs", label: "Comms", color: "var(--lcars-purple)", group: 3 },
  { href: "/analytics", label: "Sensors", color: "var(--lcars-purple)", group: 3 },
  { href: "/terminal", label: "Console", color: "var(--lcars-amber)", group: 0 },
  { href: "/git", label: "Helm", color: "var(--lcars-rust)", group: 1 },
];

const groupColors = [
  "var(--lcars-amber)",
  "var(--lcars-rust)",
  "var(--lcars-blue)",
  "var(--lcars-purple)",
];

export function LCARSNav() {
  const pathname = usePathname();
  let lastGroup = -1;

  return (
    <nav className="lcars-nav lcars-boot-2" style={{ height: "100%" }}>
      {/* Top elbow connector — the signature LCARS L-shape */}
      <div
        style={{
          width: "100%",
          height: "80px",
          backgroundColor: "var(--lcars-amber)",
          borderRadius: "0 0 50px 0",
          position: "relative",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: "calc(100% - 40px)",
            height: "40px",
            backgroundColor: "var(--lcars-black)",
            borderRadius: "0 50px 0 0",
          }}
        />
        {/* LCARS label inside elbow */}
        <span
          style={{
            position: "absolute",
            top: "8px",
            left: "8px",
            fontFamily: "var(--font-heading)",
            fontSize: "9px",
            letterSpacing: "0.2em",
            color: "var(--lcars-black)",
            textTransform: "uppercase",
            fontWeight: 700,
          }}
        >
          47-C
        </span>
      </div>

      {/* Vertical colored strip + nav items */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Vertical bar with color segments and separators */}
        <div
          style={{
            width: "40px",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ flex: 3, backgroundColor: "var(--lcars-amber)" }} />
          <div className="lcars-nav-separator" />
          <div style={{ flex: 2, backgroundColor: "var(--lcars-rust)" }} />
          <div className="lcars-nav-separator" />
          <div style={{ flex: 2, backgroundColor: "var(--lcars-blue)" }} />
          <div className="lcars-nav-separator" />
          <div style={{ flex: 1, backgroundColor: "var(--lcars-purple)" }} />
          <div className="lcars-nav-separator" />
          <div style={{ flex: 1, backgroundColor: "var(--lcars-blue-dark)" }} />
        </div>

        {/* Nav items area */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "1px",
            padding: "8px 0",
            overflowY: "auto",
          }}
        >
          {navItems.map((item, index) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            const showGroupSep = lastGroup !== -1 && item.group !== lastGroup;
            lastGroup = item.group;

            return (
              <div key={item.href}>
                {showGroupSep && (
                  <div
                    style={{
                      height: "1px",
                      margin: "4px 16px",
                      backgroundColor: groupColors[item.group],
                      opacity: 0.3,
                    }}
                  />
                )}
                <Link
                  href={item.href}
                  className={`lcars-nav-item ${isActive ? "active" : ""}`}
                  style={{
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
                  <span
                    style={{
                      fontSize: "11px",
                      letterSpacing: "0.2em",
                    }}
                  >
                    {item.label}
                  </span>
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom elbow connector — mirror of top */}
      <div
        style={{
          width: "100%",
          height: "60px",
          backgroundColor: "var(--lcars-blue-dark)",
          borderRadius: "0 50px 0 0",
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
            height: "30px",
            backgroundColor: "var(--lcars-black)",
            borderRadius: "0 0 0 50px",
          }}
        />
      </div>
    </nav>
  );
}
