import type { Metadata } from "next";
import { appearanceScript } from "@/lib/appearance";
import "./globals.css";

export const metadata: Metadata = {
  title: "CareerMatch · Job Match Agent",
  description: "Find eligible jobs, compare your skills, and save the roles that fit.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: appearanceScript }} /></head>
      <body className="min-h-screen">
        <div className="ambient-background" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
