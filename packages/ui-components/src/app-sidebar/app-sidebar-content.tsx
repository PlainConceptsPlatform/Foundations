"use client";

import type { ReactNode } from "react";
import { cn } from "../lib/utils";

type AppSidebarContentProps = {
  children: ReactNode;
  className?: string;
};

export function AppSidebarContent({ children, className }: AppSidebarContentProps) {
  return (
    <div data-sidebar="content" className={cn("flex flex-col gap-1", className)}>
      {children}
    </div>
  );
}

type AppSidebarFooterProps = {
  children: ReactNode;
  className?: string;
};

export function AppSidebarFooter({ children, className }: AppSidebarFooterProps) {
  return (
    <div data-sidebar="footer" className={cn("mt-auto", className)}>
      {children}
    </div>
  );
}

export function AppSidebarSpacer() {
  return <div className="flex-1" />;
}
