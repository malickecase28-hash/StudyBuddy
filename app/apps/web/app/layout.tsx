import "katex/dist/katex.min.css";
import "@xyflow/react/dist/style.css";
import "@fontsource/source-serif-4/400.css";
import "@fontsource/source-serif-4/600.css";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/600.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@forma/ui/forma.css";
import "./globals.css";
import { themeCss } from "@forma/ui";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { Providers } from "@/components/shell/Providers";

export const metadata: Metadata = {
  title: { default: "Forma", template: "%s · Forma" },
  description: "Forma: shape how you understand. Living, exact diagrams for university courses.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="paper" suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: themeCss() }} />
      </head>
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
