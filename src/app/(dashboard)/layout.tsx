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
        {/* Sidebar - LCARS dual-curve structure */}
        <div className="app-sidebar-outer">
          {/* Left icon strip */}
          <div className="sidebar-icon-strip">
            <i className="fas fa-cross" />
            <i className="fas fa-sync" />
            <i className="fas fa-database" />
            <i className="fas fa-shield-alt" />
            <i className="fas fa-satellite" />
          </div>
          <div className="app-sidebar-inner">
            <LCARSNav />
          </div>
        </div>

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
