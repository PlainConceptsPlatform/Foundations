import "./global.css";
import { Toaster } from "@/components/ui/toaster";
import { RootProvider } from "fumadocs-ui/provider";
import { Outfit } from "next/font/google";
import type { ReactNode } from "react";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-sans" });

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={outfit.variable} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <RootProvider>{children}</RootProvider>
        <Toaster />
      </body>
    </html>
  );
}
