"use client";

import { LCARSHeader } from "@/components/LCARSHeader";
import { LCARSNav } from "@/components/LCARSNav";
import { LCARSStatusPanel } from "@/components/LCARSStatusPanel";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
        backgroundColor: "var(--lcars-black)",
      }}
    >
      {/* Top Header Bar */}
      <LCARSHeader />

      {/* Main body: Nav | Content | Status */}
      <div
        style={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
        }}
      >
        {/* Left Nav Rail */}
        <LCARSNav />

        {/* Main Content Area */}
        <main
          className="lcars-boot-4"
          style={{
            flex: 1,
            overflow: "auto",
            backgroundColor: "var(--lcars-bg)",
            padding: "20px",
            position: "relative",
          }}
        >
          {children}
        </main>

        {/* Right Status Panel */}
        <LCARSStatusPanel />
      </div>
    </div>
  );
}
