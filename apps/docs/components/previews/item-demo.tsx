"use client";

import { Button } from "@/components/ui/button";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "@/components/ui/item";
import { Bell, Check, MoreHorizontal } from "lucide-react";

export function ItemDemo() {
  return (
    <ItemGroup className="max-w-sm rounded-lg border">
      <Item variant="outline" size="sm">
        <ItemMedia variant="icon">
          <Bell />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>New release available</ItemTitle>
          <ItemDescription>
            shadcn/ui v4 is out with Base UI support and new components.
          </ItemDescription>
        </ItemContent>
        <Button variant="ghost" size="icon-sm">
          <MoreHorizontal />
        </Button>
      </Item>
      <ItemSeparator />
      <Item variant="outline" size="sm">
        <ItemMedia variant="icon">
          <Check />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Components synced</ItemTitle>
          <ItemDescription>All 50 components are now in the docs sidebar.</ItemDescription>
        </ItemContent>
      </Item>
    </ItemGroup>
  );
}
