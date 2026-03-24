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
    <nav className="lcars-header main-header navbar navbar-expand navbar-dark lcars-boot-1">
      <div className="lcars-header-inner container-fluid">
        <div className="lcars-header-left">
          <span className="logo-lg">SCOTTY &mdash; NCC-1701-OC</span>
          <div className="lcars-header-indicator rust" />
          <div className="lcars-header-indicator blue" />
          <div className="lcars-header-indicator primary" />
        </div>
        <ul className="lcars-header-right navbar-nav ml-auto">
          <li className="nav-item">SD {stardate}</li>
        </ul>
      </div>
    </nav>
  );
}

// Keep legacy export
export { LCARSTopBar as LCARSHeader };
