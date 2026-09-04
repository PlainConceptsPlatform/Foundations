"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export function CollapsibleDemo() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full max-w-sm space-y-2">
      <div className="flex items-center gap-3 px-4">
        <h4 className="text-sm font-semibold">Foundation packages</h4>
        <CollapsibleTrigger asChild>
          <Button variant="outline" size="sm">
            {isOpen ? "Hide" : "Show"}
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="space-y-2">
        <div className="rounded-md border px-4 py-2 text-sm">@plainconceptsplatform/ui-theme</div>
        <div className="rounded-md border px-4 py-2 text-sm">
          @plainconceptsplatform/ui-components
        </div>
        <div className="rounded-md border px-4 py-2 text-sm">docs (this app)</div>
      </CollapsibleContent>
    </Collapsible>
  );
}
