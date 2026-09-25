import "katex/dist/katex.min.css";
import "@xyflow/react/dist/style.css";
import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { Providers } from "@/components/shell/Providers";

export const metadata: Metadata = {
  title: "StudyBuddy · Learning workspace",
  description: "An interactive study workspace for university courses, starting with Electromagnetics I.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="paper" suppressHydrationWarning>
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
