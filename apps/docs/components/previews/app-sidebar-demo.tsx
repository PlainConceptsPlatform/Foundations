"use client";

import {
  FolderKanban,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Monitor,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
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

const navItems = [
  { label: "Overview", icon: LayoutDashboard, active: true },
  { label: "Projects", icon: FolderKanban, active: false },
  { label: "Team", icon: Users, active: false },
  { label: "Settings", icon: Settings, active: false },
];

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
    <AppSidebarProvider className="overflow-hidden rounded-md border">
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
              {navItems.map((item) => (
                <AppSidebarNavItem
                  key={item.label}
                  to="#"
                  active={item.active}
                  icon={item.icon}
                  label={item.label}
                />
              ))}
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
