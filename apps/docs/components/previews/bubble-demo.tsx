"use client";

import { Bubble, BubbleContent, BubbleGroup, BubbleReactions } from "@/components/ui/bubble";
import { Frown, SmilePlus, ThumbsUp } from "lucide-react";

export function BubbleDemo() {
  return (
    <BubbleGroup className="max-w-md">
      <Bubble>
        <BubbleContent>Hey! How's the new theme working out?</BubbleContent>
        <BubbleReactions side="bottom" align="end">
          <button type="button" className="rounded-full p-1 hover:bg-muted">
            <ThumbsUp className="size-3.5" />
          </button>
          <button type="button" className="rounded-full p-1 hover:bg-muted">
            <SmilePlus className="size-3.5" />
          </button>
        </BubbleReactions>
      </Bubble>
      <Bubble variant="secondary" align="end">
        <BubbleContent>Looking great so far! The tokens map nicely to Recharts.</BubbleContent>
      </Bubble>
      <Bubble variant="outline">
        <BubbleContent>One small issue with the sidebar tokens though.</BubbleContent>
        <BubbleReactions side="bottom" align="start">
          <button type="button" className="rounded-full p-1 hover:bg-muted">
            <Frown className="size-3.5" />
          </button>
        </BubbleReactions>
      </Bubble>
    </BubbleGroup>
  );
}
