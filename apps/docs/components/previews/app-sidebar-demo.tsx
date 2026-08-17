"use client";

import {
  BarChart3,
  LayoutGrid,
  LogOut,
  Monitor,
  Moon,
  PanelLeft,
  PanelLeftClose,
  Settings,
  Sparkles,
  Sun,
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
  AppSidebarThemeToggle,
  AppSidebarUserCard,
  AppSidebarUserMenuDivider,
  AppSidebarUserMenuItem,
} from "@plainconceptsplatform/ui-components/app-sidebar";

type Theme = "light" | "dark" | "system";

export function AppSidebarDemo() {
  const [active, setActive] = useState("Team AI Usage");
  const [theme, setTheme] = useState<Theme>("light");

  const item = (label: string, icon: typeof Monitor, iconClassName?: string) => (
    <AppSidebarNavItem
      key={label}
      to="#"
      label={label}
      icon={icon}
      iconClassName={iconClassName}
      isActive={active === label}
      onClick={() => setActive(label)}
    />
  );

  return (
    <AppSidebarProvider>
      <div className="flex h-[520px] overflow-hidden rounded-md border">
        <AppSidebar className="h-full">
          <AppSidebarHeader>
            <AppSidebarBrand
              name="Atlas"
              logo={
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-5">
                  <path d="M12 3 2.5 20h4.2L12 10.6 17.3 20h4.2L12 3Z" />
                </svg>
              }
            />
            <AppSidebarActions>
              <AppSidebarIconButton icon={<LayoutGrid size={16} />} label="Switch app" />
              <AppSidebarCollapseButton
                expandIcon={<PanelLeft size={16} />}
                collapseIcon={<PanelLeftClose size={16} />}
              />
            </AppSidebarActions>
          </AppSidebarHeader>

          <AppSidebarContent>
            <AppSidebarNav>
              {item("My assets", Monitor)}
              {item("My AI Usage", Sparkles, "text-violet-500")}
              {item("My DevOps Projects", BarChart3)}
            </AppSidebarNav>

            <AppSidebarSeparator />

            <AppSidebarNavGroup label="AI and cloud">
              {item("Team AI Usage", Sparkles, "text-violet-500")}
              {item("Forge Ops", Sparkles, "text-violet-500")}
            </AppSidebarNavGroup>

            <AppSidebarSeparator />

            <AppSidebarNavGroup label="Administration">
              {item("Settings", Settings)}
            </AppSidebarNavGroup>
          </AppSidebarContent>

          <AppSidebarFooter>
            <AppSidebarUserCard
              name="Quique Fernández Guerra"
              avatar="QG"
              dropdown={
                <>
                  <AppSidebarThemeToggle
                    value={theme}
                    onChange={setTheme}
                    icons={{
                      light: <Sun size={14} />,
                      dark: <Moon size={14} />,
                      system: <Monitor size={14} />,
                    }}
                  />
                  <AppSidebarUserMenuDivider />
                  <AppSidebarUserMenuItem icon={<LogOut size={14} />}>
                    Sign out
                  </AppSidebarUserMenuItem>
                </>
              }
            />
          </AppSidebarFooter>
        </AppSidebar>

        <div className="flex flex-1 items-center justify-center bg-background p-6 text-sm text-muted-foreground">
          Main content area
        </div>
      </div>
    </AppSidebarProvider>
  );
}
