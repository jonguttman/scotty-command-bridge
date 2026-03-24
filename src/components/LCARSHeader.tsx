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

  useEffect(() => {
    const update = () => {
      setStardate(calculateStardate());
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="lcars-header lcars-boot-1">
      <div className="lcars-header-inner">
        <div className="lcars-header-left">
          <span>SCOTTY &mdash; NCC-1701-OC</span>
          <div className="lcars-header-indicator rust" />
          <div className="lcars-header-indicator blue" />
          <div className="lcars-header-indicator primary" />
        </div>
        <div className="lcars-header-right">
          SD {stardate}
        </div>
      </div>
    </div>
  );
}

// Keep legacy export
export { LCARSTopBar as LCARSHeader };
