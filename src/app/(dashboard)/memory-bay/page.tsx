"use client";

import { useEffect, useState, useCallback } from "react";

interface Thought {
  id: string;
  content: string;
  created_at: string;
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

export default function MemoryBayPage() {
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [newThought, setNewThought] = useState("");
  const [capturing, setCapturing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, lastUpdated: "" });

  const fetchThoughts = useCallback(async (query?: string) => {
    setLoading(true);
    setError("");
    try {
      const url = query
        ? `/api/open-brain?action=search&q=${encodeURIComponent(query)}`
        : "/api/open-brain?action=recent&limit=20";
      const res = await fetch(url);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setThoughts(data.thoughts || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load thoughts");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/open-brain?action=stats");
      const data = await res.json();
      if (!data.error) {
        setStats({ total: data.total || 0, lastUpdated: data.lastUpdated || "" });
      }
    } catch {
      // Non-critical
    }
  }, []);

  useEffect(() => {
    fetchThoughts();
    fetchStats();
  }, [fetchThoughts, fetchStats]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      fetchThoughts(searchQuery.trim());
    } else {
      fetchThoughts();
    }
  };

  const handleCapture = async () => {
    if (!newThought.trim()) return;
    setCapturing(true);
    try {
      const res = await fetch("/api/open-brain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newThought.trim() }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setNewThought("");
      fetchThoughts();
      fetchStats();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to capture thought");
    } finally {
      setCapturing(false);
    }
  };

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
            backgroundColor: "var(--lcars-blue)",
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
          Memory Bay — Open Brain Interface
        </h2>
        <div
          style={{
            flex: 1,
            height: "2px",
            background: "linear-gradient(90deg, var(--lcars-blue), transparent)",
          }}
        />
      </div>

      {/* Stats Bar */}
      <div
        className="lcars-card lcars-card-blue"
        style={{ marginBottom: "20px", animation: "lcars-slide-up 0.4s ease-out 0.4s both" }}
      >
        <div className="lcars-card-body" style={{ padding: "10px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <span
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "28px",
                  color: "var(--lcars-blue)",
                  lineHeight: 1,
                }}
              >
                {stats.total}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "9px",
                  letterSpacing: "0.2em",
                  color: "var(--lcars-text-dim)",
                  textTransform: "uppercase",
                }}
              >
                Total Thoughts
              </span>
            </div>
            <div
              style={{
                flex: 1,
                height: "1px",
                backgroundColor: "var(--lcars-blue)",
                opacity: 0.2,
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                color: "var(--lcars-text-dim)",
              }}
            >
              {stats.lastUpdated ? `LAST UPDATE: ${timeAgo(stats.lastUpdated)}` : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div
        style={{
          marginBottom: "20px",
          animation: "lcars-slide-up 0.4s ease-out 0.5s both",
        }}
      >
        <div style={{ display: "flex", gap: "8px" }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="SEARCH MEMORY CORE"
            style={{
              flex: 1,
              padding: "10px 16px",
              backgroundColor: "var(--lcars-bg)",
              border: "2px solid var(--lcars-amber)",
              borderRadius: "0 20px 20px 0",
              fontFamily: "var(--font-heading)",
              fontSize: "13px",
              letterSpacing: "0.15em",
              color: "var(--lcars-text)",
              textTransform: "uppercase",
              outline: "none",
            }}
          />
          <button
            onClick={handleSearch}
            style={{
              padding: "10px 24px",
              backgroundColor: "var(--lcars-blue)",
              border: "none",
              borderRadius: "20px",
              fontFamily: "var(--font-heading)",
              fontSize: "12px",
              letterSpacing: "0.15em",
              color: "var(--lcars-black)",
              textTransform: "uppercase",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            SCAN
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "40px",
          }}
        >
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
        <div
          className="lcars-card lcars-card-rust"
          style={{ marginBottom: "20px" }}
        >
          <div className="lcars-card-body" style={{ padding: "12px 16px" }}>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                color: "var(--lcars-red)",
              }}
            >
              ERROR: {error}
            </span>
          </div>
        </div>
      )}

      {/* Thought Cards */}
      {!loading && !error && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            marginBottom: "24px",
            animation: "lcars-slide-up 0.4s ease-out 0.6s both",
          }}
        >
          {thoughts.length === 0 ? (
            <div
              className="lcars-card lcars-card-blue"
            >
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
                  No thoughts in memory core
                </span>
              </div>
            </div>
          ) : (
            thoughts.map((thought, index) => {
              const isExpanded = expandedId === thought.id;
              const preview =
                thought.content.length > 100 && !isExpanded
                  ? thought.content.slice(0, 100) + "..."
                  : thought.content;

              return (
                <div
                  key={thought.id}
                  className="lcars-card lcars-card-blue"
                  style={{
                    cursor: "pointer",
                    animation: `lcars-slide-up 0.3s ease-out ${0.6 + index * 0.03}s both`,
                  }}
                  onClick={() =>
                    setExpandedId(isExpanded ? null : thought.id)
                  }
                >
                  <div
                    className="lcars-card-body"
                    style={{ padding: "10px 16px" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: "16px",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "12px",
                          color: "var(--lcars-text)",
                          lineHeight: 1.5,
                          flex: 1,
                          whiteSpace: isExpanded ? "pre-wrap" : "normal",
                        }}
                      >
                        {preview}
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "9px",
                          color: "var(--lcars-text-dim)",
                          flexShrink: 0,
                          marginTop: "2px",
                        }}
                      >
                        {timeAgo(thought.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* New Thought Capture */}
      <div
        className="lcars-card lcars-card-blue"
        style={{ animation: "lcars-slide-up 0.4s ease-out 0.8s both" }}
      >
        <div className="lcars-card-header">
          <span className="lcars-card-title" style={{ color: "var(--lcars-blue)" }}>
            Thought Capture
          </span>
        </div>
        <div className="lcars-card-body" style={{ padding: "12px 16px" }}>
          <textarea
            value={newThought}
            onChange={(e) => setNewThought(e.target.value)}
            placeholder="ENTER NEW THOUGHT FOR MEMORY CORE..."
            rows={3}
            style={{
              width: "100%",
              padding: "10px 12px",
              backgroundColor: "var(--lcars-bg)",
              border: "1px solid var(--lcars-blue)",
              borderRadius: "8px",
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              color: "var(--lcars-text)",
              resize: "vertical",
              outline: "none",
              marginBottom: "10px",
            }}
          />
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={handleCapture}
              disabled={capturing || !newThought.trim()}
              style={{
                padding: "8px 28px",
                backgroundColor: capturing
                  ? "var(--lcars-text-dim)"
                  : "var(--lcars-blue)",
                border: "none",
                borderRadius: "20px",
                fontFamily: "var(--font-heading)",
                fontSize: "12px",
                letterSpacing: "0.15em",
                color: "var(--lcars-black)",
                textTransform: "uppercase",
                cursor: capturing ? "wait" : "pointer",
                fontWeight: 600,
                opacity: !newThought.trim() ? 0.5 : 1,
              }}
            >
              {capturing ? "CAPTURING..." : "CAPTURE"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
