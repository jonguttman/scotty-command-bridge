"use client";

import { useEffect, useState } from "react";
import { Settings, RefreshCw } from "lucide-react";
import { SystemInfo } from "@/components/SystemInfo";
import { IntegrationStatus } from "@/components/IntegrationStatus";
import { QuickActions } from "@/components/QuickActions";

interface SystemData {
  agent: {
    name: string;
    creature: string;
    emoji: string;
  };
  system: {
    uptime: number;
    uptimeFormatted: string;
    nodeVersion: string;
    model: string;
    workspacePath: string;
    platform: string;
    hostname: string;
    memory: {
      total: number;
      free: number;
      used: number;
    };
  };
  integrations: Array<{
    id: string;
    name: string;
    status: "connected" | "disconnected" | "configured" | "not_configured";
    icon: string;
    lastActivity: string | null;
  }>;
  timestamp: string;
}

export default function SettingsPage() {
  const [systemData, setSystemData] = useState<SystemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchSystemData = async () => {
    try {
      const res = await fetch("/api/system");
      const data = await res.json();
      setSystemData(data);
      setLastRefresh(new Date());
    } catch (error) {
      console.error("Failed to fetch system data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemData();
    const interval = setInterval(fetchSystemData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    fetchSystemData();
  };

  return (
    <div style={{ padding: "2rem" }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p style={{ fontSize: "0.95rem", color: "#8a9ab8", marginTop: "0.4rem" }}>
            System status, integrations, and configuration
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {lastRefresh && (
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "#8a9ab8" }}>
              {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={loading}
            style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              padding: "0.5rem 1rem", borderRadius: "0.5rem",
              background: "#1a1d24", border: "1px solid rgba(255,255,255,0.06)",
              color: "#c8cfe0", cursor: "pointer", fontSize: "0.85rem",
              opacity: loading ? 0.5 : 1,
            }}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* System Info - Full width on first row */}
        <div className="lg:col-span-2">
          <SystemInfo data={systemData} />
        </div>

        {/* Integration Status */}
        <div>
          <IntegrationStatus integrations={systemData?.integrations || null} />
        </div>

        {/* Quick Actions */}
        <div>
          <QuickActions onActionComplete={handleRefresh} />
        </div>
      </div>

      {/* Footer Info */}
      <div 
        className="mt-6 md:mt-8 p-3 md:p-4 rounded-xl"
        style={{ 
          backgroundColor: "rgba(26, 26, 26, 0.5)", 
          border: "1px solid var(--border)" 
        }}
      >
        <div className="flex items-center justify-between text-sm" style={{ color: "var(--text-muted)" }}>
          <span>Mission Control v1.0.0</span>
          <span>OpenClaw Agent Dashboard</span>
        </div>
      </div>
    </div>
  );
}
