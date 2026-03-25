"use client";

import { useEffect, useState, useCallback } from "react";
import { Newspaper, RefreshCw, ExternalLink, Radio } from "lucide-react";

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
    const interval = setInterval(fetchBriefs, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchBriefs]);

  return (
    <div style={{ padding: "2rem", maxWidth: "80rem" }}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">R&D Intelligence</h1>
          <p style={{ fontSize: "0.95rem", color: "#8a9ab8", marginTop: "0.4rem" }}>
            Latest briefs from #rd-briefs
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Radio style={{ width: "1.2rem", height: "1.2rem", color: "#0bd08a" }} />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "#8a9ab8" }}>
              Auto-refresh 5m
            </span>
          </div>
          {lastRefresh && (
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "#8a9ab8" }}>
              {lastRefresh.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
            </span>
          )}
          <button
            onClick={fetchBriefs}
            disabled={loading}
            style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              padding: "0.5rem 1rem", borderRadius: "0.5rem",
              background: "#1a1d24", border: "1px solid rgba(255,255,255,0.06)",
              color: "#c8cfe0", cursor: loading ? "wait" : "pointer",
              fontSize: "0.85rem", opacity: loading ? 0.6 : 1,
            }}
          >
            <RefreshCw style={{ width: "1.4rem", height: "1.4rem", animation: loading ? "spin 0.8s linear infinite" : "none" }} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="content-card" style={{
          marginBottom: "1.5rem", background: "rgba(213,81,56,0.1)",
          border: "1px solid rgba(213,81,56,0.2)", color: "#ff6b6b", fontSize: "0.9rem",
        }}>
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && briefs.length === 0 && (
        <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
          <div style={{
            width: "2rem", height: "2rem",
            border: "2px solid rgba(255,255,255,0.06)", borderTopColor: "#915e4d",
            borderRadius: "50%", animation: "spin 0.8s linear infinite",
          }} />
        </div>
      )}

      {/* Empty */}
      {!loading && !error && briefs.length === 0 && (
        <div className="empty-state">
          <Newspaper />
          <p>No intelligence reports received</p>
        </div>
      )}

      {/* Brief Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
        {briefs.map((brief, index) => {
          const lines = brief.text.split("\n").filter((l) => l.trim());
          const title = lines[0] || "";
          const body = lines.slice(1).join("\n");

          return (
            <div key={index} className="content-card" style={{ transition: "background 0.1s" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#1e2129"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#1a1d24"; }}
            >
              {/* Title */}
              <div style={{
                fontSize: "0.95rem", fontWeight: 600, color: "#e0e4f0",
                marginBottom: body ? "0.6rem" : "0.4rem", lineHeight: 1.5,
              }}>
                {title}
              </div>

              {/* Body */}
              {body && (
                <div style={{
                  fontFamily: "var(--font-mono)", fontSize: "0.85rem",
                  color: "#c8cfe0", opacity: 0.85, lineHeight: 1.7,
                  whiteSpace: "pre-wrap", marginBottom: "0.8rem",
                }}>
                  {body}
                </div>
              )}

              {/* Footer */}
              <div style={{
                display: "flex", alignItems: "center", gap: "1rem",
                borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "0.6rem",
              }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "#8a9ab8" }}>
                  {brief.timestamp ? timeAgo(brief.timestamp) : "—"}
                </span>
                {brief.permalink && (
                  <a
                    href={brief.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex", alignItems: "center", gap: "0.3rem",
                      fontSize: "0.75rem", color: "#8a9ab8", textDecoration: "none",
                    }}
                  >
                    <ExternalLink style={{ width: "1rem", height: "1rem" }} />
                    View in Slack
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
