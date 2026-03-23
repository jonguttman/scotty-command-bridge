"use client";

import { LCARSTopBar } from "@/components/LCARSHeader";
import { LCARSNav } from "@/components/LCARSNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="lcars-root">
      {/* Top strip — thin indicator row */}
      <LCARSTopBar />

      {/* Body: Sidebar | Main */}
      <div className="lcars-body">
        {/* Sidebar wrapper creates left gap */}
        <div className="lcars-sidebar-wrapper">
          <aside className="lcars-sidebar">
            <LCARSNav />
          </aside>
        </div>
        <main className="lcars-main">
          <div className="lcars-content lcars-boot-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
