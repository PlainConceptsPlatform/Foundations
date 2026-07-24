"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const data = [
  { month: "Jan", theme: 186, components: 80 },
  { month: "Feb", theme: 205, components: 130 },
  { month: "Mar", theme: 237, components: 145 },
  { month: "Apr", theme: 173, components: 110 },
  { month: "May", theme: 209, components: 160 },
  { month: "Jun", theme: 214, components: 170 },
];

const chartConfig = {
  theme: { label: "Theme", color: "var(--primary)" },
  components: { label: "Components", color: "var(--accent)" },
} satisfies ChartConfig;

export function ChartDemo() {
  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-[260px] w-full max-w-xl">
      <BarChart data={data}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="theme" fill="var(--color-theme)" radius={4} />
        <Bar dataKey="components" fill="var(--color-components)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
