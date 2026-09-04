"use client";

import { Button } from "@/components/ui/button";
import { DirectionProvider } from "@/components/ui/direction";

export function DirectionDemo() {
  return (
    <DirectionProvider dir="rtl">
      <div className="flex flex-col gap-2">
        <Button>Select to toggle text direction</Button>
        <p className="text-sm text-muted-foreground">
          This content is wrapped in a <code>DirectionProvider</code> with
          <code> dir="rtl"</code>. Text flows right-to-left, which is useful for Arabic, Hebrew, and
          other RTL languages.
        </p>
      </div>
    </DirectionProvider>
  );
}
