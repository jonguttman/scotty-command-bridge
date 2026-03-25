"use client";

import { useEffect, useState, useCallback } from "react";
import { Target, Save, RotateCcw, Eye, Edit3 } from "lucide-react";

export default function GoalsPage() {
  const [content, setContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [lastSaved, setLastSaved] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [viewMode, setViewMode] = useState<"edit" | "preview">("preview");

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/goals");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setContent(data.content || "");
      setOriginalContent(data.content || "");
      setLastSaved(data.lastSaved || "");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load GOALS.md");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSaveSuccess(false);
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setOriginalContent(content);
      setLastSaved(data.lastSaved || new Date().toISOString());
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setContent(originalContent);
    setError("");
  };

  const hasChanges = content !== originalContent;

  function renderMarkdown(md: string) {
    const lines = md.split("\n");
    const elements: React.ReactNode[] = [];
    let inList = false;
    let listItems: string[] = [];

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} style={{ margin: "0.6rem 0", paddingLeft: "1.8rem" }}>
            {listItems.map((item, i) => (
              <li key={i} style={{ fontSize: "0.9rem", color: "#c8cfe0", marginBottom: "0.3rem", lineHeight: 1.6 }}>
                {item}
              </li>
            ))}
          </ul>
        );
        listItems = [];
        inList = false;
      }
    };

    lines.forEach((line, i) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("# ")) {
        flushList();
        elements.push(
          <h1 key={i} style={{ fontSize: "1.4rem", color: "#e0e4f0", fontFamily: "var(--font-mono)", margin: "1.5rem 0 0.6rem", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "0.5rem" }}>
            {trimmed.slice(2)}
          </h1>
        );
      } else if (trimmed.startsWith("## ")) {
        flushList();
        elements.push(
          <h2 key={i} style={{ fontSize: "1.15rem", color: "#e0e4f0", fontFamily: "var(--font-mono)", margin: "1.2rem 0 0.5rem" }}>
            {trimmed.slice(3)}
          </h2>
        );
      } else if (trimmed.startsWith("### ")) {
        flushList();
        elements.push(
          <h3 key={i} style={{ fontSize: "0.95rem", color: "#c8cfe0", fontFamily: "var(--font-mono)", margin: "1rem 0 0.4rem" }}>
            {trimmed.slice(4)}
          </h3>
        );
      } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        inList = true;
        listItems.push(trimmed.slice(2));
      } else if (trimmed === "") {
        flushList();
        elements.push(<div key={i} style={{ height: "0.6rem" }} />);
      } else {
        flushList();
        elements.push(
          <p key={i} style={{ fontSize: "0.9rem", color: "#c8cfe0", margin: "0.3rem 0", lineHeight: 1.6 }}>
            {trimmed}
          </p>
        );
      }
    });
    flushList();
    return elements;
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "90rem" }}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Goals</h1>
          <p style={{ fontSize: "0.95rem", color: "#8a9ab8", marginTop: "0.4rem" }}>
            Mission objectives — GOALS.md editor
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
          {/* View toggle */}
          <div style={{
            display: "flex", background: "#1a1d24", borderRadius: "0.4rem",
            border: "1px solid rgba(255,255,255,0.06)", padding: "0.2rem",
          }}>
            <button
              onClick={() => setViewMode("preview")}
              style={{
                display: "flex", alignItems: "center", gap: "0.4rem",
                padding: "0.4rem 0.8rem", borderRadius: "0.3rem", border: "none",
                background: viewMode === "preview" ? "rgba(145,94,77,0.3)" : "transparent",
                color: viewMode === "preview" ? "#e0e4f0" : "#8a9ab8",
                cursor: "pointer", fontSize: "0.8rem", fontWeight: 600,
              }}
            >
              <Eye style={{ width: "1.2rem", height: "1.2rem" }} /> Preview
            </button>
            <button
              onClick={() => setViewMode("edit")}
              style={{
                display: "flex", alignItems: "center", gap: "0.4rem",
                padding: "0.4rem 0.8rem", borderRadius: "0.3rem", border: "none",
                background: viewMode === "edit" ? "rgba(145,94,77,0.3)" : "transparent",
                color: viewMode === "edit" ? "#e0e4f0" : "#8a9ab8",
                cursor: "pointer", fontSize: "0.8rem", fontWeight: 600,
              }}
            >
              <Edit3 style={{ width: "1.2rem", height: "1.2rem" }} /> Edit
            </button>
          </div>

          {hasChanges && (
            <span className="badge badge-pending" style={{ fontSize: "0.7rem" }}>Modified</span>
          )}

          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "#8a9ab8" }}>
            {content.length} chars
          </span>

          {lastSaved && (
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "#8a9ab8" }}>
              Saved {new Date(lastSaved).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
            </span>
          )}
        </div>
      </div>

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

      {/* Error */}
      {error && (
        <div className="content-card" style={{
          marginBottom: "1.5rem", background: "rgba(213,81,56,0.1)",
          border: "1px solid rgba(213,81,56,0.2)", color: "#ff6b6b", fontSize: "0.9rem",
        }}>
          {error}
        </div>
      )}

      {/* Success */}
      {saveSuccess && (
        <div className="content-card" style={{
          marginBottom: "1.5rem", background: "rgba(11,208,138,0.1)",
          border: "1px solid rgba(11,208,138,0.2)", color: "#0bd08a", fontSize: "0.9rem",
        }}>
          Goals saved successfully
        </div>
      )}

      {/* Action bar */}
      {!loading && (
        <div style={{ display: "flex", gap: "0.6rem", marginBottom: "1.5rem" }}>
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              padding: "0.5rem 1.2rem", borderRadius: "0.5rem",
              background: saving ? "#8a9ab8" : "#915e4d",
              border: "none", color: "#e0e4f0", cursor: saving ? "wait" : "pointer",
              fontSize: "0.85rem", fontWeight: 600,
              opacity: !hasChanges ? 0.4 : 1,
            }}
          >
            <Save style={{ width: "1.4rem", height: "1.4rem" }} />
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            onClick={handleDiscard}
            disabled={!hasChanges}
            style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              padding: "0.5rem 1.2rem", borderRadius: "0.5rem",
              background: "transparent", border: "1px solid rgba(255,255,255,0.06)",
              color: "#c8cfe0", cursor: "pointer", fontSize: "0.85rem",
              opacity: !hasChanges ? 0.4 : 1,
            }}
          >
            <RotateCcw style={{ width: "1.4rem", height: "1.4rem" }} />
            Discard
          </button>
        </div>
      )}

      {/* Editor / Preview */}
      {!loading && (
        <div style={{ display: "grid", gridTemplateColumns: viewMode === "edit" ? "1fr 1fr" : "1fr", gap: "1.5rem" }}>
          {/* Editor pane */}
          {viewMode === "edit" && (
            <div className="content-card" style={{ padding: 0 }}>
              <div className="section-label" style={{ padding: "1rem 1.5rem 0.5rem", marginBottom: 0 }}>Editor</div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                style={{
                  width: "100%", minHeight: "50rem", padding: "1rem 1.5rem",
                  background: "transparent", border: "none", outline: "none",
                  fontFamily: "var(--font-mono)", fontSize: "0.9rem",
                  color: "#c8cfe0", resize: "vertical", lineHeight: 1.6,
                }}
              />
            </div>
          )}

          {/* Preview pane */}
          <div className="content-card">
            <div className="section-label">Preview</div>
            <div style={{ minHeight: viewMode === "edit" ? "50rem" : "30rem" }}>
              {content.trim() ? (
                renderMarkdown(content)
              ) : (
                <div className="empty-state" style={{ padding: "2rem" }}>
                  <Target />
                  <p>No goals defined yet. Switch to edit mode to add objectives.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
