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
