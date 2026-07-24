import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

export function HoverCardDemo() {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button variant="link">@plainconcepts</Button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="flex justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">@plainconcepts</h4>
            <p className="text-sm text-muted-foreground">
              Plain Concepts platform shared foundation: theme tokens, components, and docs.
            </p>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
