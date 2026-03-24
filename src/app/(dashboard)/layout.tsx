"use client";

import { LCARSTopBar } from "@/components/LCARSHeader";
import { LCARSNav } from "@/components/LCARSNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <LCARSTopBar />
      <div className="app-body">
        {/* Left decorative icon column */}
        <div className="app-icon-col">
          <div className="app-icon rust">◆</div>
          <div className="app-icon teal">◎</div>
          <div className="app-icon blue">⊕</div>
          <div className="app-icon orange">◈</div>
          <div className="app-icon green">●</div>
        </div>

        {/* Sidebar */}
        <aside className="app-sidebar">
          <LCARSNav />
        </aside>

        {/* Main content */}
        <main className="app-main">
          <section className="app-content">
            {children}
          </section>
        </main>
      </div>
    </>
  );
}
