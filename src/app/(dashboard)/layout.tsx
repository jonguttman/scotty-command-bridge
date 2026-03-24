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
      {/* Header — sits above sidebar + main */}
      <LCARSTopBar />

      {/* Body: Sidebar | Main */}
      <div className="lcars-body">
        {/* Sidebar — outer creates gradient + mega bottom-left curve */}
        <div className="lcars-sidebar-outer lcars-boot-2">
          <div className="lcars-sidebar-inner">
            <LCARSNav />
          </div>
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
