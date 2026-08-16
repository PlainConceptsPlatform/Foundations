"use client";

import { Changelog } from "@plainconceptsplatform/ui-components/changelog";
import type { ChangelogEntry } from "@plainconceptsplatform/ui-components/changelog";
import { format } from "date-fns";
import { Sparkles } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const DEMO_ENTRIES: ChangelogEntry[] = [
  {
    id: "42",
    title: "Export quotes to PDF",
    type: "feature",
    date: "2025-01-15",
    text: "## What's new\n\nYou can now **export quotes** as PDF directly from the quote editor.\n\n- Supports custom branding\n- Includes line-item totals\n- Works in light and dark mode",
  },
  {
    id: "38",
    title: "Fixed date picker timezone offset",
    type: "bugfix",
    date: "2025-01-10",
    text: "Dates picked in the afternoon were shifting to the previous day in some timezones. Fixed by normalising to `noon UTC` before formatting.",
  },
  {
    id: "35",
    title: "Faster account list loading",
    type: "improvement",
    date: "2025-01-05",
    text: "The accounts page now loads **3x faster** by deferring non-critical fields. Search results appear instantly.",
  },
];

const SAMPLE_MD = DEMO_ENTRIES[0]?.text ?? "";

function SimpleMarkdown({ md }: { md: string }) {
  const lines = md.split("\n");
  const elements: React.ReactNode[] = [];
  let list: React.ReactNode[] = [];
  let listKey = 0;

  const flushList = () => {
    if (list.length > 0) {
      elements.push(<ul key={`ul-${listKey++}`}>{list}</ul>);
      list = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("## ")) {
      flushList();
      elements.push(<h2 key={`h-${elements.length}`}>{trimmed.slice(3)}</h2>);
    } else if (trimmed.startsWith("# ")) {
      flushList();
      elements.push(<h1 key={`h-${elements.length}`}>{trimmed.slice(2)}</h1>);
    } else if (trimmed.startsWith("### ")) {
      flushList();
      elements.push(<h3 key={`h-${elements.length}`}>{trimmed.slice(4)}</h3>);
    } else if (trimmed.startsWith("- ")) {
      const content = parseInline(trimmed.slice(2));
      list.push(<li key={`li-${elements.length}-${list.length}`}>{content}</li>);
    } else if (trimmed === "") {
      flushList();
    } else {
      flushList();
      elements.push(<p key={`p-${elements.length}`}>{parseInline(trimmed)}</p>);
    }
  }
  flushList();

  return <>{elements}</>;
}

function parseInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|`(.+?)`)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  match = regex.exec(text);
  while (match !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    if (match[2] != null) {
      parts.push(
        <strong key={`b-${i++}`} className="font-semibold">
          {match[2]}
        </strong>,
      );
    } else if (match[3] != null) {
      parts.push(
        <code key={`c-${i++}`} className="rounded bg-muted px-1 py-0.5 text-xs">
          {match[3]}
        </code>,
      );
    }
    last = regex.lastIndex;
    match = regex.exec(text);
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export function ChangelogDemo() {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="w-full">
      <div className="flex items-center justify-center py-4">
        <Changelog
          entries={DEMO_ENTRIES}
          slots={{
            Dialog,
            DialogContent,
            DialogHeader,
            DialogTitle,
            DialogDescription,
            Button,
          }}
          texts={{
            trigger: "What's new",
            title: "Latest changes",
            description: "Recently implemented issues and improvements.",
            noEntries: "No entries yet.",
            typeLabels: {
              feature: "Feature",
              bugfix: "Bugfix",
              improvement: "Improvement",
            },
          }}
          icons={{ IconSparkles: Sparkles }}
          renderMarkdown={(md) => <SimpleMarkdown md={md} />}
          formatDate={(d) => format(new Date(d), "MMM d, yyyy")}
          open={open}
          onOpenChange={setOpen}
        />
      </div>
      <pre className="mt-4 overflow-x-auto rounded-md border border-border bg-muted/50 p-3 text-xs">
        <code>{SAMPLE_MD}</code>
      </pre>
    </div>
  );
}

export function ChangelogSidebarItem() {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="px-[-0.5rem] [&_button]:w-full [&_button]:justify-start [&_button]:gap-2 [&_button]:rounded-md [&_button]:px-2 [&_button]:py-1.5 [&_button]:text-sidebar-foreground/80 [&_button]:text-sm [&_button]:transition-colors [&_button]:duration-150 hover:[&_button]:bg-sidebar-accent hover:[&_button]:text-sidebar-accent-foreground">
      <Changelog
        entries={DEMO_ENTRIES}
        slots={{
          Dialog,
          DialogContent,
          DialogHeader,
          DialogTitle,
          DialogDescription,
          Button,
        }}
        texts={{
          trigger: "What's new",
          title: "Latest changes",
          description: "Recently implemented issues and improvements.",
          noEntries: "No entries yet.",
          typeLabels: {
            feature: "Feature",
            bugfix: "Bugfix",
            improvement: "Improvement",
          },
        }}
        icons={{ IconSparkles: Sparkles }}
        renderMarkdown={(md) => <SimpleMarkdown md={md} />}
        formatDate={(d) => format(new Date(d), "MMM d, yyyy")}
        open={open}
        onOpenChange={setOpen}
      />
    </div>
  );
}
