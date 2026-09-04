"use client";

import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker";
import { Calendar } from "lucide-react";

export function MarkerDemo() {
  return (
    <div className="flex flex-col gap-6 max-w-md">
      <Marker variant="default">
        <MarkerIcon>
          <Calendar />
        </MarkerIcon>
        <MarkerContent>January 24, 2026</MarkerContent>
      </Marker>
      <Marker variant="separator">
        <MarkerContent>Or continue with</MarkerContent>
      </Marker>
      <Marker variant="border">
        <MarkerContent>Section break</MarkerContent>
      </Marker>
    </div>
  );
}
