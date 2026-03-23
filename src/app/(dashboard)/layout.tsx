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
      {/* Top strip + Toolbar */}
      <LCARSTopBar />

      {/* Body: Sidebar | Main */}
      <div className="lcars-body">
        <aside className="lcars-sidebar">
          <LCARSNav />
        </aside>
        <main className="lcars-main">
          <div className="lcars-content lcars-boot-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
