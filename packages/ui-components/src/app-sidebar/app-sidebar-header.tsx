"use client";

import type { ReactNode } from "react";
import { cn } from "../lib/utils";
import { useAppSidebar } from "./app-sidebar-context";

type AppSidebarHeaderProps = {
  children: ReactNode;
  className?: string;
};

export function AppSidebarHeader({ children, className }: AppSidebarHeaderProps) {
  const { collapsed } = useAppSidebar();

  return (
    <div
      data-sidebar="header"
      className={cn("flex items-center gap-1.5", collapsed && "flex-col gap-1", className)}
    >
      {children}
    </div>
  );
}

type AppSidebarBrandProps = {
  logo: ReactNode;
  name: string;
  href?: string;
  onClick?: () => void;
  className?: string;
};

export function AppSidebarBrand({ logo, name, href, onClick, className }: AppSidebarBrandProps) {
  const { collapsed } = useAppSidebar();

  const content = (
    <>
      <span className="inline-flex shrink-0 items-center text-sidebar-primary" aria-hidden="true">
        {logo}
      </span>
      <span
        className={cn("flex flex-col leading-[1.1] text-sidebar-foreground", collapsed && "hidden")}
      >
        <span className="text-sidebar-primary tracking-widest font-bold uppercase">{name}</span>
      </span>
    </>
  );

  const baseClass = cn(
    "flex flex-1 items-center gap-2.5 rounded-md bg-transparent px-2 py-1.5 text-base font-semibold tracking-tight text-sidebar-foreground",
    "hover:bg-sidebar-hover focus-visible:outline-2 focus-visible:outline-sidebar-ring focus-visible:outline-offset-1",
    "min-w-0 cursor-pointer text-left border-none",
    className,
  );

  if (href) {
    return (
      <a href={href} className={baseClass} title={collapsed ? name : undefined} onClick={onClick}>
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      className={baseClass}
      title={collapsed ? name : undefined}
      onClick={onClick}
    >
      {content}
    </button>
  );
}

type AppSidebarActionsProps = {
  children: ReactNode;
  className?: string;
};

export function AppSidebarActions({ children, className }: AppSidebarActionsProps) {
  const { collapsed } = useAppSidebar();

  return (
    <div
      data-sidebar="actions"
      className={cn("flex shrink-0 items-center gap-0.5", collapsed && "flex-col", className)}
    >
      {children}
    </div>
  );
}
