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
  const [hostname, setHostname] = useState("NCC-1701-OC");

  useEffect(() => {
    const update = () => setStardate(calculateStardate());
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setHostname(window.location.hostname.toUpperCase() || "NCC-1701-OC");
    }
  }, []);

  return (
    <header className="app-header">
      <div className="app-header-brand">
        <span style={{fontSize:'1.8rem', lineHeight:1}}>🦞</span>
        <span>SCOTTY — NCC-1701-OC</span>
      </div>
      <div className="app-header-right">
        <div className="app-header-box">{hostname}</div>
        <div className="app-header-pill">≡</div>
      </div>
    </header>
  );
}

// Keep legacy export
export { LCARSTopBar as LCARSHeader };
