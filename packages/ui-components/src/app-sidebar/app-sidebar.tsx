"use client";

import type { ReactNode } from "react";
import { cn } from "../lib/utils";
import { useAppSidebar } from "./app-sidebar-context";

type AppSidebarProps = {
  children: ReactNode;
  className?: string;
  id?: string;
};

export function AppSidebar({ children, className, id }: AppSidebarProps) {
  const { collapsed } = useAppSidebar();

  return (
    <aside
      id={id}
      data-sidebar="root"
      data-collapsed={collapsed}
      className={cn(
        "flex h-screen flex-col gap-[14px] overflow-y-auto border-r border-sidebar-border bg-sidebar p-[14px] px-3 sticky top-0",
        "transition-[width,padding] duration-200 ease-linear",
        collapsed ? "w-16 px-2" : "w-[280px]",
        className,
      )}
    >
      {children}
    </aside>
  );
}
