"use client";

import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { cn } from "../lib/utils";
import { useAppSidebar } from "./app-sidebar-context";

type AppSidebarUserCardProps = {
  name: string;
  subtitle?: string;
  avatar: ReactNode;
  dropdown?: ReactNode;
  className?: string;
};

export function AppSidebarUserCard({
  name,
  subtitle,
  avatar,
  dropdown,
  className,
}: AppSidebarUserCardProps) {
  const { collapsed } = useAppSidebar();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open, handleClickOutside]);

  return (
    <div ref={wrapRef} data-sidebar="user-card-wrap" className={cn("relative", className)}>
      {open && dropdown && (
        <div
          data-sidebar="user-menu"
          className={cn(
            "absolute bottom-full left-0 right-0 mb-1.5 rounded-lg border border-sidebar-border bg-popover p-1 shadow-lg",
            collapsed && "left-auto right-0 min-w-[200px]",
          )}
          role="menu"
        >
          {dropdown}
        </div>
      )}
      <button
        type="button"
        data-sidebar="user-card"
        className={cn(
          "flex items-center gap-2.5 rounded-md border border-sidebar-border bg-muted/50 p-2 cursor-pointer select-none outline-none w-full text-left",
          "hover:bg-sidebar-hover focus-visible:outline-2 focus-visible:outline-sidebar-ring focus-visible:outline-offset-1",
          collapsed && "justify-center",
        )}
        title={collapsed ? name : undefined}
        aria-haspopup={dropdown ? "true" : undefined}
        aria-expanded={dropdown ? open : undefined}
        onClick={() => dropdown && setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (dropdown && (e.key === "Enter" || e.key === " ")) {
            setOpen((o) => !o);
          }
        }}
      >
        {avatar}
        <div className={cn("flex flex-1 flex-col min-w-0", collapsed && "hidden")}>
          <span className="truncate text-[13px] font-medium text-sidebar-foreground">{name}</span>
          {subtitle && <span className="text-[11.5px] text-muted-foreground">{subtitle}</span>}
        </div>
      </button>
    </div>
  );
}

type AppSidebarUserMenuItemProps = {
  icon?: ReactNode;
  children: ReactNode;
  onClick?: () => void;
  className?: string;
};

export function AppSidebarUserMenuItem({
  icon,
  children,
  onClick,
  className,
}: AppSidebarUserMenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-popover-foreground",
        "hover:bg-sidebar-hover cursor-pointer border-none bg-transparent text-left",
        className,
      )}
      onClick={onClick}
    >
      {icon && <span className="flex size-4 items-center justify-center">{icon}</span>}
      {children}
    </button>
  );
}

export function AppSidebarUserMenuDivider({ className }: { className?: string }) {
  return <div className={cn("my-1 h-px bg-sidebar-border", className)} />;
}

type AppSidebarThemeToggleProps = {
  value: "light" | "dark" | "system";
  onChange: (value: "light" | "dark" | "system") => void;
  icons?: {
    light: ReactNode;
    dark: ReactNode;
    system: ReactNode;
  };
  labels?: {
    light: string;
    dark: string;
    system: string;
  };
  className?: string;
};

export function AppSidebarThemeToggle({
  value,
  onChange,
  icons,
  labels = { light: "Light", dark: "Dark", system: "System" },
  className,
}: AppSidebarThemeToggleProps) {
  const options: Array<"light" | "dark" | "system"> = ["light", "dark", "system"];

  return (
    <fieldset className={cn("flex gap-1 px-1 py-0.5", className)}>
      {options.map((pref) => (
        <button
          key={pref}
          type="button"
          className={cn(
            "flex flex-1 items-center justify-center gap-1 rounded border border-transparent bg-transparent px-1 py-1.5 text-[11px] text-muted-foreground cursor-pointer transition-colors",
            "hover:bg-sidebar-hover hover:text-sidebar-foreground",
            value === pref && "bg-sidebar-accent text-sidebar-primary border-sidebar-primary/30",
          )}
          title={labels[pref]}
          aria-label={labels[pref]}
          aria-pressed={value === pref}
          onClick={() => onChange(pref)}
        >
          {icons?.[pref]}
        </button>
      ))}
    </fieldset>
  );
}
