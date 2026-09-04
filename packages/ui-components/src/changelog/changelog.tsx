"use client";

import { useState } from "react";
import { cn } from "../lib/utils";
import data from "./data.json";
import type { ChangelogEntry, ChangelogEntryType, ChangelogProps } from "./types";

export type { ChangelogEntry, ChangelogEntryType, ChangelogProps };

const TYPE_BADGE_CLASS: Record<ChangelogEntryType, string> = {
  feature: "bg-success/15 text-success border-success/30",
  bugfix: "bg-destructive/15 text-destructive border-destructive/30",
  improvement: "bg-info/15 text-info border-info/30",
};

export function Changelog(props: ChangelogProps) {
  const {
    entries,
    slots,
    texts,
    icons,
    renderMarkdown,
    formatDate,
    open: openProp,
    onOpenChange,
  } = props;

  const {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    Button,
    ScrollArea,
  } = slots;

  const { IconSparkles } = icons;

  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : internalOpen;
  const setOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

  const allEntries = entries ?? (data as ChangelogEntry[]);
  const sorted = [...allEntries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const ScrollWrapper = ScrollArea ?? "div";
  const scrollClassName = ScrollArea
    ? "max-h-[calc(80vh-8rem)]"
    : "max-h-[calc(80vh-8rem)] overflow-y-auto pr-1";

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)} aria-label={texts.trigger}>
        <IconSparkles className="size-4" />
        {texts.trigger}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="flex max-h-[80vh] max-w-[90vw] flex-col overflow-hidden p-0 sm:max-w-2xl"
          showCloseButton
        >
          <DialogHeader className="shrink-0 border-b border-border p-6 pb-4">
            <DialogTitle>{texts.title}</DialogTitle>
            <DialogDescription>{texts.description}</DialogDescription>
          </DialogHeader>

          <ScrollWrapper className="flex-1 overflow-y-auto p-6 pt-4">
            <div className="flex flex-col gap-4 py-2">
              {sorted.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground text-sm">{texts.noEntries}</p>
              ) : (
                sorted.map((entry) => (
                  <article key={entry.id} className="rounded-lg border border-border bg-card p-4">
                    <div className="flex items-start gap-3">
                      <span
                        className={cn(
                          "mt-0.5 shrink-0 rounded-md border px-2 py-0.5 text-xs font-medium capitalize",
                          TYPE_BADGE_CLASS[entry.type],
                        )}
                      >
                        {texts.typeLabels[entry.type]}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-card-foreground text-sm leading-snug">
                          {entry.title}
                        </h4>
                        <p className="mt-0.5 text-muted-foreground text-xs">
                          {formatDate(entry.date)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 text-card-foreground text-sm leading-relaxed [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs [&_h1]:text-base [&_h1]:font-semibold [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-1 [&_h3]:text-sm [&_h3]:font-medium [&_li]:ml-4 [&_li]:list-disc [&_ol]:ml-4 [&_ol]:list-decimal [&_p]:my-1 [&_ul]:my-1 [&_ul]:list-disc [&_ul]:ml-4">
                      {renderMarkdown(entry.text)}
                    </div>
                  </article>
                ))
              )}
            </div>
          </ScrollWrapper>
        </DialogContent>
      </Dialog>
    </>
  );
}
