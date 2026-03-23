"use client";

import { useEffect, useState, useCallback } from "react";

interface Brief {
  text: string;
  timestamp: string | null;
  permalink: string;
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return "N/A";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function RDIntelPage() {
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchBriefs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/rd-intel");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setBriefs(data.briefs || []);
      setLastRefresh(new Date());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load intel feed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBriefs();
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchBriefs, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchBriefs]);

  return (
    <div className="lcars-data-bg">
      {/* Page Title */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            width: "8px",
            height: "32px",
            backgroundColor: "var(--lcars-purple)",
            borderRadius: "4px",
          }}
        />
        <h2
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "20px",
            fontWeight: 400,
            letterSpacing: "0.2em",
            color: "var(--lcars-text)",
            textTransform: "uppercase",
            margin: 0,
          }}
        >
          R&D Intelligence Feed — #rd-briefs
        </h2>
        <div
          style={{
            flex: 1,
            height: "2px",
            background: "linear-gradient(90deg, var(--lcars-purple), transparent)",
          }}
        />
      </div>

      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "20px",
          animation: "lcars-slide-up 0.4s ease-out 0.4s both",
        }}
      >
        <button
          onClick={fetchBriefs}
          disabled={loading}
          style={{
            padding: "8px 24px",
            backgroundColor: loading
              ? "var(--lcars-text-dim)"
              : "var(--lcars-purple)",
            border: "none",
            borderRadius: "20px",
            fontFamily: "var(--font-heading)",
            fontSize: "12px",
            letterSpacing: "0.15em",
            color: "var(--lcars-black)",
            textTransform: "uppercase",
            cursor: loading ? "wait" : "pointer",
            fontWeight: 600,
          }}
        >
          {loading ? "SCANNING..." : "REFRESH FEED"}
        </button>
        <div style={{ flex: 1 }} />
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            color: "var(--lcars-text-dim)",
          }}
        >
          {lastRefresh
            ? `LAST SCAN: ${lastRefresh.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
              })}`
            : "—"}
        </span>
        <span
          className="lcars-blink"
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: "var(--lcars-purple)",
          }}
        />
        <span
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "9px",
            letterSpacing: "0.15em",
            color: "var(--lcars-purple)",
            textTransform: "uppercase",
          }}
        >
          AUTO-REFRESH 5M
        </span>
      </div>

      {/* Loading State */}
      {loading && briefs.length === 0 && (
        <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              border: "3px solid var(--lcars-bg)",
              borderTopColor: "var(--lcars-amber)",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="lcars-card lcars-card-rust" style={{ marginBottom: "20px" }}>
          <div className="lcars-card-body" style={{ padding: "12px 16px" }}>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                color: "var(--lcars-red)",
              }}
            >
              SIGNAL LOST: {error}
            </span>
          </div>
        </div>
      )}

      {/* Briefs */}
      {!loading && !error && briefs.length === 0 && (
        <div className="lcars-card lcars-card-purple">
          <div className="lcars-card-body" style={{ padding: "24px 16px", textAlign: "center" }}>
            <span
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "13px",
                letterSpacing: "0.2em",
                color: "var(--lcars-text-dim)",
                textTransform: "uppercase",
              }}
            >
              No intelligence reports received
            </span>
          </div>
        </div>
      )}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        {briefs.map((brief, index) => {
          const lines = brief.text.split("\n").filter((l) => l.trim());
          const title = lines[0] || "";
          const body = lines.slice(1).join("\n");

          return (
            <div
              key={index}
              className="lcars-card lcars-card-purple"
              style={{
                animation: `lcars-slide-up 0.3s ease-out ${0.5 + index * 0.05}s both`,
              }}
            >
              <div className="lcars-card-body" style={{ padding: "12px 16px" }}>
                {/* Title (first line bold) */}
                <div
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "13px",
                    letterSpacing: "0.1em",
                    color: "var(--lcars-text)",
                    textTransform: "uppercase",
                    marginBottom: body ? "8px" : "4px",
                    lineHeight: 1.4,
                  }}
                >
                  {title}
                </div>

                {/* Body */}
                {body && (
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      color: "var(--lcars-text)",
                      opacity: 0.8,
                      lineHeight: 1.6,
                      whiteSpace: "pre-wrap",
                      marginBottom: "8px",
                    }}
                  >
                    {body}
                  </div>
                )}

                {/* Footer: timestamp + permalink */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    borderTop: "1px solid rgba(153, 102, 204, 0.2)",
                    paddingTop: "6px",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "9px",
                      color: "var(--lcars-text-dim)",
                    }}
                  >
                    {brief.timestamp ? timeAgo(brief.timestamp) : "—"}
                  </span>
                  {brief.permalink && (
                    <a
                      href={brief.permalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontSize: "9px",
                        letterSpacing: "0.1em",
                        color: "var(--lcars-purple)",
                        textDecoration: "none",
                        textTransform: "uppercase",
                      }}
                    >
                      VIEW IN SLACK →
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
