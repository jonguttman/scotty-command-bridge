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

export function LCARSHeader() {
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
    <div className="lcars-boot-1">
      {/* Main header bar */}
      <div className="lcars-header">
        {/* Amber left section */}
        <div className="lcars-header-amber">
          <span
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "14px",
              fontWeight: 700,
              letterSpacing: "0.2em",
              color: "var(--lcars-black)",
              textTransform: "uppercase",
            }}
          >
            LCARS 47
          </span>
        </div>

        {/* Center title section */}
        <div className="lcars-header-title">
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <h1
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "22px",
                fontWeight: 400,
                letterSpacing: "0.2em",
                color: "var(--lcars-text)",
                textTransform: "uppercase",
                margin: 0,
              }}
            >
              Scotty Command Bridge
            </h1>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                color: "var(--lcars-text-dim)",
                letterSpacing: "0.1em",
              }}
            >
              OPENCLAW GATEWAY
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "10px",
                  letterSpacing: "0.15em",
                  color: "var(--lcars-text-dim)",
                  textTransform: "uppercase",
                }}
              >
                Stardate
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "var(--lcars-amber)",
                }}
              >
                {stardate}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "10px",
                  letterSpacing: "0.15em",
                  color: "var(--lcars-text-dim)",
                  textTransform: "uppercase",
                }}
              >
                Ship Time
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "var(--lcars-blue)",
                }}
              >
                {time}
              </div>
            </div>
          </div>
        </div>

        {/* Right cap */}
        <div className="lcars-header-cap" />
      </div>

      {/* Color stripe */}
      <div className="lcars-header-stripe" />
    </div>
  );
}
