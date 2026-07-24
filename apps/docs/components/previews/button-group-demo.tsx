"use client";

import { Button } from "@/components/ui/button";
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from "@/components/ui/button-group";
import { Check, ChevronRight, Copy } from "lucide-react";

export function ButtonGroupDemo() {
  return (
    <div className="flex flex-col gap-4">
      <ButtonGroup>
        <Button variant="outline" size="sm">
          <Copy /> Copy
        </Button>
        <Button variant="outline" size="icon-sm">
          <Check />
        </Button>
      </ButtonGroup>

      <ButtonGroup>
        <ButtonGroupText>$ 99</ButtonGroupText>
        <ButtonGroupSeparator />
        <Button variant="outline" size="sm">
          <ChevronRight /> Expand
        </Button>
      </ButtonGroup>
    </div>
  );
}
