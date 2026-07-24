"use client";

import { format } from "date-fns";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";

export function DatePickerDemo() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(2026, 0, 12),
    to: new Date(2026, 0, 18),
  });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-[260px] justify-start text-left font-normal",
            !date && "text-muted-foreground",
          )}
        >
          <CalendarIcon />
          {date?.from ? (
            date.to ? (
              <>
                {format(date.from, "LLL d")} – {format(date.to, "LLL d, y")}
              </>
            ) : (
              format(date.from, "LLL d, y")
            )
          ) : (
            <span>Pick a date range</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="range" selected={date} onSelect={setDate} numberOfMonths={2} />
      </PopoverContent>
    </Popover>
  );
}
