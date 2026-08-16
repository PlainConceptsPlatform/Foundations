import type { ComponentType, ReactNode } from "react";

export type ChangelogEntryType = "feature" | "bugfix" | "improvement";

export type ChangelogEntry = {
  id: string;
  title: string;
  type: ChangelogEntryType;
  date: string;
  text: string;
};

// biome-ignore lint/suspicious/noExplicitAny: Button slot variants are app-specific unions (e.g. shadcn's "default" | "ghost" | "outline" | …). Loosening to ComponentType<any> lets each consuming app pass its own Button without friction, matching the slot pattern used by DataTableSlots.
type AnyComponent = ComponentType<any>;

export type ChangelogSlots = {
  Dialog: AnyComponent;
  DialogContent: AnyComponent;
  DialogHeader: AnyComponent;
  DialogTitle: AnyComponent;
  DialogDescription: AnyComponent;
  Button: AnyComponent;
  ScrollArea?: AnyComponent;
};

export type ChangelogTexts = {
  trigger: string;
  title: string;
  description: string;
  noEntries: string;
  typeLabels: Record<ChangelogEntryType, string>;
};

export type ChangelogIcons = {
  IconSparkles: AnyComponent;
};

export type ChangelogProps = {
  entries?: ChangelogEntry[];
  slots: ChangelogSlots;
  texts: ChangelogTexts;
  icons: ChangelogIcons;
  renderMarkdown: (md: string) => ReactNode;
  formatDate: (date: string) => string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};
