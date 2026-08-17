"use client";

import type { ReactNode } from "react";
import { cn } from "../lib/utils";
import { useAppSidebar } from "./app-sidebar-context";

type AppSidebarCollapseButtonProps = {
  expandIcon: ReactNode;
  collapseIcon: ReactNode;
  expandLabel?: string;
  collapseLabel?: string;
  className?: string;
};

export function AppSidebarCollapseButton({
  expandIcon,
  collapseIcon,
  expandLabel = "Expand sidebar",
  collapseLabel = "Collapse sidebar",
  className,
}: AppSidebarCollapseButtonProps) {
  const { collapsed, toggle } = useAppSidebar();

  return (
    <button
      type="button"
      className={cn(
        "flex size-7 items-center justify-center rounded-md bg-transparent text-muted-foreground",
        "hover:bg-sidebar-hover hover:text-sidebar-foreground",
        "focus-visible:outline-2 focus-visible:outline-sidebar-ring focus-visible:outline-offset-1",
        "cursor-pointer border-none",
        className,
      )}
      aria-label={collapsed ? expandLabel : collapseLabel}
      aria-expanded={!collapsed}
      title={collapsed ? `${expandLabel} (Ctrl+B)` : `${collapseLabel} (Ctrl+B)`}
      onClick={toggle}
    >
      {collapsed ? expandIcon : collapseIcon}
    </button>
  );
}

type AppSidebarIconButtonProps = {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  className?: string;
};

export function AppSidebarIconButton({
  icon,
  label,
  onClick,
  className,
}: AppSidebarIconButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "flex size-7 items-center justify-center rounded-md bg-transparent text-muted-foreground",
        "hover:bg-sidebar-hover hover:text-sidebar-foreground",
        "focus-visible:outline-2 focus-visible:outline-sidebar-ring focus-visible:outline-offset-1",
        "cursor-pointer border-none",
        className,
      )}
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      {icon}
    </button>
  );
}
