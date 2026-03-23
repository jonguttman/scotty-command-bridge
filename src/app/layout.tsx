import type { Metadata } from "next";
import { Antonio, Space_Mono, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const antonio = Antonio({
  subsets: ["latin"],
  variable: "--font-antonio",
  weight: ["400", "500", "600", "700"],
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-space-mono",
  weight: ["400", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "Scotty Command Bridge — OpenClaw",
  description: "LCARS Mission Control for OpenClaw agents",
  manifest: "/manifest.json",
  themeColor: "#0d0f14",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <script dangerouslySetInnerHTML={{__html:`if("serviceWorker"in navigator)navigator.serviceWorker.register("/sw.js")`}} />
      </head>
      <body
        className={`${antonio.variable} ${spaceMono.variable} ${jetbrainsMono.variable}`}
        style={{
          backgroundColor: '#0d0f14',
          color: 'var(--lcars-text)',
          fontFamily: 'var(--font-body)',
          margin: 0,
          padding: 0,
          overflow: 'hidden',
          height: '100vh',
        }}
      >
        {children}
      </body>
    </html>
  );
}
