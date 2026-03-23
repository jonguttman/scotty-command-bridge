"use client";

import { useEffect, useState, useCallback } from "react";

export default function GoalsPage() {
  const [content, setContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [lastSaved, setLastSaved] = useState("");
  const [charCount, setCharCount] = useState(0);
  const [saveSuccess, setSaveSuccess] = useState(false);

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
      setCharCount(data.charCount || 0);
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
      setCharCount(data.charCount || content.length);
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

  // Simple markdown to HTML (headings, bold, lists, paragraphs)
  function renderMarkdown(md: string) {
    const lines = md.split("\n");
    const elements: React.ReactNode[] = [];
    let inList = false;
    let listItems: string[] = [];

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul
            key={`list-${elements.length}`}
            style={{ margin: "8px 0", paddingLeft: "20px" }}
          >
            {listItems.map((item, i) => (
              <li
                key={i}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  color: "var(--lcars-text)",
                  marginBottom: "4px",
                }}
              >
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
          <h1
            key={i}
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "18px",
              letterSpacing: "0.2em",
              color: "var(--lcars-amber)",
              textTransform: "uppercase",
              margin: "16px 0 8px",
              borderBottom: "1px solid rgba(255, 153, 0, 0.3)",
              paddingBottom: "6px",
            }}
          >
            {trimmed.slice(2)}
          </h1>
        );
      } else if (trimmed.startsWith("## ")) {
        flushList();
        elements.push(
          <h2
            key={i}
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "15px",
              letterSpacing: "0.15em",
              color: "var(--lcars-amber)",
              textTransform: "uppercase",
              margin: "12px 0 6px",
              opacity: 0.9,
            }}
          >
            {trimmed.slice(3)}
          </h2>
        );
      } else if (trimmed.startsWith("### ")) {
        flushList();
        elements.push(
          <h3
            key={i}
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "13px",
              letterSpacing: "0.1em",
              color: "var(--lcars-text)",
              textTransform: "uppercase",
              margin: "10px 0 4px",
            }}
          >
            {trimmed.slice(4)}
          </h3>
        );
      } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        inList = true;
        listItems.push(trimmed.slice(2));
      } else if (trimmed === "") {
        flushList();
        elements.push(<div key={i} style={{ height: "8px" }} />);
      } else {
        flushList();
        elements.push(
          <p
            key={i}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              color: "var(--lcars-text)",
              margin: "4px 0",
              lineHeight: 1.6,
            }}
          >
            {trimmed}
          </p>
        );
      }
    });
    flushList();
    return elements;
  }

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
            backgroundColor: "var(--lcars-amber)",
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
          Mission Objectives — Goals.md
        </h2>
        <div
          style={{
            flex: 1,
            height: "2px",
            background: "linear-gradient(90deg, var(--lcars-amber), transparent)",
          }}
        />
      </div>

      {/* Loading */}
      {loading && (
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

      {/* Error */}
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
              ERROR: {error}
            </span>
          </div>
        </div>
      )}

      {/* Success */}
      {saveSuccess && (
        <div
          className="lcars-card lcars-card-green"
          style={{ marginBottom: "12px", animation: "lcars-slide-up 0.3s ease-out both" }}
        >
          <div className="lcars-card-body" style={{ padding: "8px 16px" }}>
            <span
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "12px",
                letterSpacing: "0.15em",
                color: "var(--lcars-green)",
                textTransform: "uppercase",
              }}
            >
              Transmission Saved Successfully
            </span>
          </div>
        </div>
      )}

      {/* Toolbar */}
      {!loading && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "16px",
            animation: "lcars-slide-up 0.4s ease-out 0.4s both",
          }}
        >
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            style={{
              padding: "8px 24px",
              backgroundColor: saving
                ? "var(--lcars-text-dim)"
                : "var(--lcars-amber)",
              border: "none",
              borderRadius: "20px",
              fontFamily: "var(--font-heading)",
              fontSize: "12px",
              letterSpacing: "0.15em",
              color: "var(--lcars-black)",
              textTransform: "uppercase",
              cursor: saving ? "wait" : "pointer",
              fontWeight: 600,
              opacity: !hasChanges ? 0.5 : 1,
            }}
          >
            {saving ? "TRANSMITTING..." : "SAVE TRANSMISSION"}
          </button>
          <button
            onClick={handleDiscard}
            disabled={!hasChanges}
            style={{
              padding: "8px 24px",
              backgroundColor: "transparent",
              border: "2px solid var(--lcars-rust)",
              borderRadius: "20px",
              fontFamily: "var(--font-heading)",
              fontSize: "12px",
              letterSpacing: "0.15em",
              color: "var(--lcars-rust)",
              textTransform: "uppercase",
              cursor: "pointer",
              fontWeight: 600,
              opacity: !hasChanges ? 0.4 : 1,
            }}
          >
            DISCARD
          </button>
          <div style={{ flex: 1 }} />
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              color: "var(--lcars-text-dim)",
            }}
          >
            {content.length} CHARS
          </span>
          {hasChanges && (
            <span
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "10px",
                letterSpacing: "0.1em",
                color: "var(--lcars-amber)",
                textTransform: "uppercase",
              }}
            >
              ● MODIFIED
            </span>
          )}
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              color: "var(--lcars-text-dim)",
            }}
          >
            {lastSaved
              ? `SAVED: ${new Date(lastSaved).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })}`
              : "—"}
          </span>
        </div>
      )}

      {/* Split View: Editor + Preview */}
      {!loading && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
            animation: "lcars-slide-up 0.4s ease-out 0.5s both",
          }}
        >
          {/* Editor */}
          <div className="lcars-card lcars-card-amber">
            <div className="lcars-card-header">
              <span className="lcars-card-title">Raw Transmission</span>
            </div>
            <div className="lcars-card-body" style={{ padding: "0" }}>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                style={{
                  width: "100%",
                  minHeight: "500px",
                  padding: "16px",
                  backgroundColor: "var(--lcars-bg)",
                  border: "none",
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  color: "var(--lcars-text)",
                  resize: "vertical",
                  outline: "none",
                  lineHeight: 1.6,
                }}
              />
            </div>
          </div>

          {/* Preview */}
          <div className="lcars-card lcars-card-amber">
            <div className="lcars-card-header">
              <span className="lcars-card-title">Rendered Preview</span>
            </div>
            <div
              className="lcars-card-body"
              style={{ padding: "16px", minHeight: "500px", overflowY: "auto" }}
            >
              {content.trim() ? (
                renderMarkdown(content)
              ) : (
                <span
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "13px",
                    letterSpacing: "0.2em",
                    color: "var(--lcars-text-dim)",
                    textTransform: "uppercase",
                  }}
                >
                  No mission objectives defined
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
