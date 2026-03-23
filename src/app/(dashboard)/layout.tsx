"use client";

import { LCARSTopBar } from "@/components/LCARSHeader";
import { LCARSNav } from "@/components/LCARSNav";
import { LCARSStatusPanel } from "@/components/LCARSStatusPanel";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="lcars-root">
      {/* Left Sidebar */}
      <aside className="lcars-sidebar">
        <div className="lcars-sidebar-head">
          <div className="lcars-sidebar-pill" />
        </div>
        <LCARSNav />
      </aside>

      {/* Main Area */}
      <main className="lcars-main">
        <LCARSTopBar />
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          <div className="lcars-content lcars-boot-4">
            {children}
          </div>
          <LCARSStatusPanel />
        </div>
      </main>
    </div>
  );
}
