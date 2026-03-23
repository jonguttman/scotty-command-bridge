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
    <>
      {/* Top Strip — 24px */}
      <div className="lcars-topstrip lcars-boot-1">
        <div className="lcars-topstrip-left">
          <span>SCOTTY &mdash; NCC-1701-OC</span>
          <div className="lcars-topstrip-indicator" />
          <div className="lcars-topstrip-indicator blue" />
          <div className="lcars-topstrip-indicator rust" />
        </div>
        <div className="lcars-topstrip-right">
          SD {stardate}
        </div>
      </div>

      {/* Toolbar — 40px */}
      <div className="lcars-toolbar lcars-boot-1">
        <div className="lcars-toolbar-title">SCOTTY COMMAND BRIDGE</div>
        <div className="lcars-toolbar-time">{time}</div>
      </div>
    </>
  );
}

// Keep legacy export
export { LCARSTopBar as LCARSHeader };
