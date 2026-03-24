"use client";

import { LCARSTopBar } from "@/components/LCARSHeader";
import { LCARSNav } from "@/components/LCARSNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="lcars-root wrapper">
      {/* Header — sits above sidebar + main */}
      <LCARSTopBar />

      {/* Body: Sidebar | Main */}
      <div className="lcars-body">
        {/* Sidebar — outer creates gradient + mega bottom-left curve */}
        <aside className="lcars-sidebar-outer main-sidebar lcars-boot-2">
          <div className="lcars-sidebar-inner sidebar">
            <LCARSNav />
          </div>
        </aside>

        <main className="lcars-main content-wrapper">
          <section className="lcars-content lcars-boot-4 content">
            {children}
          </section>
        </main>
      </div>
    </div>
  );
}
