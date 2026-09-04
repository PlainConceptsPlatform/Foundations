"use client";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { PackageOpen } from "lucide-react";

export function EmptyDemo() {
  return (
    <Empty className="border rounded-lg">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <PackageOpen />
        </EmptyMedia>
        <EmptyTitle>No components found</EmptyTitle>
        <EmptyDescription>
          You haven't added any components yet. Start by running the shadcn CLI to add your first
          one.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button size="sm">Add component</Button>
      </EmptyContent>
    </Empty>
  );
}
