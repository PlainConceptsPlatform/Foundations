"use client";

import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

const STORAGE_KEY = "platform.sidebar.collapsed";
const KEYBOARD_SHORTCUT = "b";

type SidebarState = "expanded" | "collapsed";

type AppSidebarContextValue = {
  state: SidebarState;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  toggle: () => void;
};

const AppSidebarContext = createContext<AppSidebarContextValue | null>(null);

let listeners: Array<() => void> = [];
let cachedCollapsed: boolean | null = null;

function getSnapshot(): boolean {
  if (cachedCollapsed === null) {
    if (typeof window !== "undefined") {
      cachedCollapsed = localStorage.getItem(STORAGE_KEY) === "true";
    } else {
      cachedCollapsed = false;
    }
  }
  return cachedCollapsed;
}

function getServerSnapshot(): boolean {
  return false;
}

function subscribe(listener: () => void): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function setCollapsedInternal(collapsed: boolean): void {
  cachedCollapsed = collapsed;
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, String(collapsed));
    document.documentElement.dataset.sidebarCollapsed = String(collapsed);
  }
  for (const listener of listeners) {
    listener();
  }
}

export function useAppSidebarCollapsed(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function toggleAppSidebar(): void {
  setCollapsedInternal(!getSnapshot());
}

export function setAppSidebarCollapsed(collapsed: boolean): void {
  setCollapsedInternal(collapsed);
}

type AppSidebarProviderProps = {
  children: ReactNode;
  defaultCollapsed?: boolean;
};

export function AppSidebarProvider({
  children,
  defaultCollapsed = false,
}: AppSidebarProviderProps) {
  const collapsed = useAppSidebarCollapsed();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized) {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === null) {
        setCollapsedInternal(defaultCollapsed);
      }
      setInitialized(true);
    }
  }, [defaultCollapsed, initialized]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        toggleAppSidebar();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const setCollapsed = useCallback((value: boolean) => {
    setCollapsedInternal(value);
  }, []);

  const toggle = useCallback(() => {
    toggleAppSidebar();
  }, []);

  const value = useMemo<AppSidebarContextValue>(
    () => ({
      state: collapsed ? "collapsed" : "expanded",
      collapsed,
      setCollapsed,
      toggle,
    }),
    [collapsed, setCollapsed, toggle],
  );

  return <AppSidebarContext.Provider value={value}>{children}</AppSidebarContext.Provider>;
}

export function useAppSidebar(): AppSidebarContextValue {
  const context = useContext(AppSidebarContext);
  if (!context) {
    throw new Error("useAppSidebar must be used within an AppSidebarProvider");
  }
  return context;
}
