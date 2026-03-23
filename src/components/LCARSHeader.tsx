"use client";

import { useEffect, useState } from "react";

function calculateStardate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const start = new Date(year, 0, 1);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  const fraction = (dayOfYear / 365).toFixed(2).substring(1);
  return `${year}${fraction}`;
}

export function LCARSTopBar() {
  const [stardate, setStardate] = useState("");
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () => {
      setStardate(calculateStardate());
      setTime(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="lcars-topbar lcars-boot-1">
      {/* Left: small colored pill indicators */}
      <div className="lcars-topbar-left">
        <div className="lcars-topbar-pill" style={{ background: "var(--lcars-amber)" }} />
        <div className="lcars-topbar-pill" style={{ background: "var(--lcars-rust)" }} />
        <div className="lcars-topbar-pill" style={{ background: "var(--lcars-blue)" }} />
        <div className="lcars-topbar-pill" style={{ background: "var(--lcars-green)" }} />
        <span className="lcars-topbar-title">SCOTTY COMMAND BRIDGE</span>
      </div>

      {/* Right: stardate + time */}
      <div className="lcars-topbar-right">
        <span className="lcars-topbar-meta">
          SD <strong>{stardate}</strong>
        </span>
        <span className="lcars-topbar-meta">
          <strong style={{ color: "var(--lcars-blue)" }}>{time}</strong>
        </span>
      </div>
    </div>
  );
}

// Keep legacy export for any other imports
export { LCARSTopBar as LCARSHeader };
