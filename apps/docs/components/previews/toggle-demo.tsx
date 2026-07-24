import { Underline } from "lucide-react";

import { Toggle } from "@/components/ui/toggle";

export function ToggleDemo() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Toggle aria-label="Toggle default">Default</Toggle>
      <Toggle variant="outline" aria-label="Toggle outline">
        Outline
      </Toggle>
      <Toggle variant="outline" disabled aria-label="Toggle disabled">
        Disabled
      </Toggle>
      <Toggle variant="outline" aria-label="Toggle underline">
        <Underline />
      </Toggle>
    </div>
  );
}
