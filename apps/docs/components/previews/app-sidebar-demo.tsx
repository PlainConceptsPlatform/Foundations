"use client";

import {
  BarChart3,
  Bell,
  FileText,
  FolderKanban,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Monitor,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Users,
} from "lucide-react";
import { useState } from "react";

import {
  AppSidebar,
  AppSidebarActions,
  AppSidebarBrand,
  AppSidebarCollapseButton,
  AppSidebarContent,
  AppSidebarFooter,
  AppSidebarHeader,
  AppSidebarIconButton,
  AppSidebarNav,
  AppSidebarNavGroup,
  AppSidebarNavItem,
  AppSidebarProvider,
  AppSidebarSeparator,
  AppSidebarSpacer,
  AppSidebarThemeToggle,
  AppSidebarUserCard,
  AppSidebarUserMenuDivider,
  AppSidebarUserMenuItem,
} from "@plainconceptsplatform/ui-components/app-sidebar";

function Avatar({ initials }: { initials: string }) {
  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-xs font-semibold text-sidebar-primary border border-sidebar-border">
      {initials}
    </span>
  );
}

export function AppSidebarDemo() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("light");

  const userDropdown = (
    <>
      <AppSidebarThemeToggle
        value={theme}
        onChange={setTheme}
        icons={{
          light: <Sun className="size-3.5" />,
          dark: <Moon className="size-3.5" />,
          system: <Monitor className="size-3.5" />,
        }}
      />
      <AppSidebarUserMenuDivider />
      <AppSidebarUserMenuItem icon={<LogOut className="size-4" />}>Sign out</AppSidebarUserMenuItem>
    </>
  );

  return (
    <AppSidebarProvider className="overflow-hidden rounded-md border" defaultCollapsed={false}>
      <AppSidebar>
        <AppSidebarHeader>
          <AppSidebarBrand
            name="Platform"
            logo={<span className="text-sidebar-primary font-bold">P</span>}
          />
          <AppSidebarActions>
            <AppSidebarIconButton icon={<LayoutGrid className="size-4" />} label="App Hub" />
            <AppSidebarCollapseButton
              expandIcon={<PanelLeftOpen className="size-4" />}
              collapseIcon={<PanelLeftClose className="size-4" />}
            />
          </AppSidebarActions>
        </AppSidebarHeader>
        <AppSidebarSeparator />

        <AppSidebarContent>
          <AppSidebarNav>
            <AppSidebarNavGroup label="Navigation">
              <AppSidebarNavItem to="#" active icon={LayoutDashboard} label="Dashboard" />
              <AppSidebarNavItem to="#" icon={FolderKanban} label="Projects" />
              <AppSidebarNavItem to="#" icon={Users} label="Team" />
            </AppSidebarNavGroup>
          </AppSidebarNav>

          <div className="my-1.5" />

          <AppSidebarNav>
            <AppSidebarNavGroup label="Compliance">
              <AppSidebarNavItem to="#" icon={ShieldCheck} label="Audit readiness" />
              <AppSidebarNavItem to="#" icon={FileText} label="Policies" />
              <AppSidebarNavItem to="#" icon={Bell} label="Findings" />
            </AppSidebarNavGroup>
          </AppSidebarNav>

          <div className="my-1.5" />

          <AppSidebarNav>
            <AppSidebarNavGroup label="Reports">
              <AppSidebarNavItem to="#" icon={BarChart3} label="Overview" />
              <AppSidebarNavItem to="#" icon={FileText} label="Reports" />
              <AppSidebarNavItem to="#" icon={Settings} label="Settings" />
            </AppSidebarNavGroup>
          </AppSidebarNav>
        </AppSidebarContent>

        <AppSidebarSpacer />

        <AppSidebarFooter>
          <AppSidebarUserCard
            name="Jane Doe"
            subtitle="Admin"
            avatar={<Avatar initials="JD" />}
            dropdown={userDropdown}
          />
        </AppSidebarFooter>
      </AppSidebar>
      <div className="flex flex-1 items-center justify-center bg-background p-6 text-sm text-muted-foreground">
        Main content area
      </div>
    </AppSidebarProvider>
  );
}
