"use client";

import { FolderKanban, LayoutDashboard, Settings, Sparkles, Users } from "lucide-react";

import {
  AppSidebar,
  AppSidebarBrand,
  AppSidebarCollapseButton,
  AppSidebarContent,
  AppSidebarFooter,
  AppSidebarHeader,
  AppSidebarNav,
  AppSidebarNavGroup,
  AppSidebarNavItem,
  AppSidebarProvider,
  AppSidebarSeparator,
  AppSidebarSpacer,
  AppSidebarUserCard,
} from "@plainconceptsplatform/ui-components/app-sidebar";

const navItems = [
  { label: "Overview", icon: LayoutDashboard, active: true },
  { label: "Projects", icon: FolderKanban, active: false },
  { label: "Team", icon: Users, active: false },
  { label: "Settings", icon: Settings, active: false },
];

export function AppSidebarDemo() {
  return (
    <AppSidebarProvider className="overflow-hidden rounded-md border">
      <AppSidebar>
        <AppSidebarHeader>
          <AppSidebarBrand name="Platform" />
        </AppSidebarHeader>
        <AppSidebarSeparator />
        <AppSidebarContent>
          <AppSidebarNav>
            <AppSidebarNavGroup label="Navigation">
              {navItems.map((item) => (
                <AppSidebarNavItem
                  key={item.label}
                  active={item.active}
                  icon={<item.icon className="size-4" />}
                  label={item.label}
                />
              ))}
            </AppSidebarNavGroup>
          </AppSidebarNav>
        </AppSidebarContent>
        <AppSidebarFooter>
          <AppSidebarUserCard name="Jane Doe" email="jane@example.com" initials="JD" />
          <AppSidebarCollapseButton />
        </AppSidebarFooter>
      </AppSidebar>
      <div className="flex flex-1 items-center justify-center bg-background p-6 text-sm text-muted-foreground">
        Main content area
      </div>
    </AppSidebarProvider>
  );
}
