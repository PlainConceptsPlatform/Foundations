"use client";

import type { ComponentType, ReactNode } from "react";
import { cn } from "../lib/utils";
import { useAppSidebar } from "./app-sidebar-context";

type AppSidebarNavProps = {
  children: ReactNode;
  className?: string;
};

export function AppSidebarNav({ children, className }: AppSidebarNavProps) {
  return (
    <nav data-sidebar="nav" className={cn("flex flex-col gap-[1px]", className)}>
      {children}
    </nav>
  );
}

type AppSidebarNavGroupProps = {
  label: string;
  children: ReactNode;
  className?: string;
};

export function AppSidebarNavGroup({ label, children, className }: AppSidebarNavGroupProps) {
  const { collapsed } = useAppSidebar();

  return (
    <div data-sidebar="nav-group" className={cn("mt-1", className)}>
      <div
        className={cn(
          "px-2 pt-1 pb-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
          collapsed && "hidden",
        )}
      >
        {label}
      </div>
      <div className="mt-[4px] flex flex-col gap-[1px]">{children}</div>
    </div>
  );
}

type IconProps = { size?: number; className?: string };

type AppSidebarNavItemProps = {
  to: string;
  label: string;
  icon: ComponentType<IconProps>;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
  /**
   * Overrides the icon colour. The default follows the item's state, which is right for
   * an icon that only identifies a destination. Pass this when the icon carries meaning
   * of its own — a colour that marks every AI feature, for instance — so it stays that
   * colour whether or not the item is active.
   */
  iconClassName?: string;
  as?: ComponentType<{
    to: string;
    className: string;
    title?: string;
    "aria-label"?: string;
    onClick?: () => void;
    children: ReactNode;
  }>;
};

export function AppSidebarNavItem({
  to,
  label,
  icon: Icon,
  isActive = false,
  onClick,
  className,
  iconClassName,
  as: LinkComponent,
}: AppSidebarNavItemProps) {
  const { collapsed } = useAppSidebar();

  const content = (
    <>
      <span
        className={cn(
          "flex size-4 shrink-0 items-center justify-center",
          isActive ? "text-sidebar-primary" : "text-muted-foreground",
          iconClassName,
        )}
      >
        <Icon size={16} />
      </span>
      <span className={cn("flex-1 min-w-0 truncate", collapsed && "hidden")}>{label}</span>
    </>
  );

  const itemClass = cn(
    "flex h-[33px] items-center gap-2.5 rounded-md border-none bg-transparent px-2.5 py-[7px]",
    "text-[13.5px] font-normal cursor-pointer text-left w-full",
    "transition-colors duration-150 ease-out hover:no-underline",
    isActive
      ? "bg-sidebar-accent text-sidebar-primary font-medium"
      : "text-sidebar-foreground/80 hover:bg-sidebar-hover hover:text-sidebar-foreground",
    collapsed && "justify-center !gap-0 !px-0",
    className,
  );

  if (LinkComponent) {
    return (
      <LinkComponent
        to={to}
        className={itemClass}
        title={collapsed ? label : undefined}
        aria-label={collapsed ? label : undefined}
        onClick={onClick}
      >
        {content}
      </LinkComponent>
    );
  }

  return (
    <a
      href={to}
      className={itemClass}
      title={collapsed ? label : undefined}
      aria-label={collapsed ? label : undefined}
      onClick={onClick}
    >
      {content}
    </a>
  );
}

export function AppSidebarSeparator({ className }: { className?: string }) {
  return (
    <div data-sidebar="separator" className={cn("mx-2 my-1.5 h-px bg-sidebar-border", className)} />
  );
}
