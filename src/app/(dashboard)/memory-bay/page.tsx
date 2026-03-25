"use client";

import { useEffect, useState, useCallback } from "react";
import { Brain, Search, RefreshCw, Plus } from "lucide-react";

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
    <div style={{ padding: "2rem", maxWidth: "80rem" }}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Memory Bay</h1>
          <p style={{ fontSize: "0.95rem", color: "#8a9ab8", marginTop: "0.4rem" }}>
            Open Brain interface — search and capture thoughts
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div className="stat-card-clean" style={{ padding: "0.8rem 1.2rem" }}>
            <Brain style={{ width: "1.6rem", height: "1.6rem", color: "#0bd08a" }} />
            <div>
              <div className="stat-number" style={{ fontSize: "1.4rem" }}>{stats.total}</div>
              <div className="stat-label">thoughts</div>
            </div>
          </div>
          <button
            onClick={() => fetchThoughts()}
            style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              padding: "0.5rem 1rem", borderRadius: "0.5rem",
              background: "#1a1d24", border: "1px solid rgba(255,255,255,0.06)",
              color: "#c8cfe0", cursor: "pointer", fontSize: "0.85rem",
            }}
          >
            <RefreshCw style={{ width: "1.4rem", height: "1.4rem" }} />
            Refresh
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", gap: "0.6rem" }}>
          <div style={{
            flex: 1, display: "flex", alignItems: "center", gap: "0.8rem",
            padding: "0.6rem 1rem", borderRadius: "0.5rem",
            background: "#1a1d24", border: "1px solid rgba(255,255,255,0.06)",
          }}>
            <Search style={{ width: "1.4rem", height: "1.4rem", color: "#8a9ab8", flexShrink: 0 }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search memory..."
              style={{
                flex: 1, background: "none", border: "none", outline: "none",
                fontFamily: "var(--font-mono)", fontSize: "0.9rem", color: "#e0e4f0",
              }}
            />
          </div>
          <button
            onClick={handleSearch}
            style={{
              padding: "0.6rem 1.5rem", borderRadius: "0.5rem",
              background: "rgba(145,94,77,0.2)", border: "1px solid rgba(145,94,77,0.3)",
              color: "#e0e4f0", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600,
            }}
          >
            Search
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="content-card" style={{
          marginBottom: "1.5rem", background: "rgba(213,81,56,0.1)",
          border: "1px solid rgba(213,81,56,0.2)", color: "#ff6b6b",
          fontSize: "0.9rem",
        }}>
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
          <div style={{
            width: "2rem", height: "2rem",
            border: "2px solid rgba(255,255,255,0.06)", borderTopColor: "#915e4d",
            borderRadius: "50%", animation: "spin 0.8s linear infinite",
          }} />
        </div>
      )}

      {/* Thoughts */}
      {!loading && !error && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "2.5rem" }}>
          <div className="section-label">
            {searchQuery ? `Results for "${searchQuery}"` : "Recent thoughts"} ({thoughts.length})
          </div>

          {thoughts.length === 0 ? (
            <div className="empty-state">
              <Brain />
              <p>No thoughts in memory core</p>
            </div>
          ) : (
            thoughts.map((thought) => {
              const isExpanded = expandedId === thought.id;
              const preview =
                thought.content.length > 150 && !isExpanded
                  ? thought.content.slice(0, 150) + "..."
                  : thought.content;

              return (
                <div
                  key={thought.id}
                  className="content-card"
                  style={{ cursor: "pointer", transition: "background 0.1s" }}
                  onClick={() => setExpandedId(isExpanded ? null : thought.id)}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#1e2129"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#1a1d24"; }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1.5rem" }}>
                    <span style={{
                      fontFamily: "var(--font-mono)", fontSize: "0.9rem",
                      color: "#c8cfe0", lineHeight: 1.6, flex: 1,
                      whiteSpace: isExpanded ? "pre-wrap" : "normal",
                    }}>
                      {preview}
                    </span>
                    <span style={{
                      fontFamily: "var(--font-mono)", fontSize: "0.75rem",
                      color: "#8a9ab8", flexShrink: 0,
                    }}>
                      {timeAgo(thought.created_at)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Thought Capture */}
      <div className="content-card">
        <div className="section-label" style={{ marginBottom: "0.8rem" }}>Capture new thought</div>
        <textarea
          value={newThought}
          onChange={(e) => setNewThought(e.target.value)}
          placeholder="Enter a new thought..."
          rows={3}
          style={{
            width: "100%", padding: "0.8rem 1rem", borderRadius: "0.5rem",
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
            fontFamily: "var(--font-mono)", fontSize: "0.9rem", color: "#e0e4f0",
            resize: "vertical", outline: "none", marginBottom: "0.8rem", lineHeight: 1.6,
          }}
        />
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={handleCapture}
            disabled={capturing || !newThought.trim()}
            style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              padding: "0.5rem 1.5rem", borderRadius: "0.5rem",
              background: capturing ? "#8a9ab8" : "#915e4d",
              border: "none", color: "#e0e4f0", cursor: capturing ? "wait" : "pointer",
              fontSize: "0.85rem", fontWeight: 600,
              opacity: !newThought.trim() ? 0.5 : 1,
            }}
          >
            <Plus style={{ width: "1.4rem", height: "1.4rem" }} />
            {capturing ? "Saving..." : "Capture"}
          </button>
        </div>
      </div>
    </div>
  );
}
