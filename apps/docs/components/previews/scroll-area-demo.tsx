import { ScrollArea } from "@/components/ui/scroll-area";

const tags = Array.from({ length: 24 }).map((_, i) => `Item ${i + 1}`);

export function ScrollAreaDemo() {
  return (
    <ScrollArea className="h-60 w-full max-w-sm rounded-md border p-4">
      <div className="flex flex-col gap-2">
        {tags.map((tag) => (
          <div key={tag} className="flex items-center gap-2 rounded-sm bg-muted px-3 py-2 text-sm">
            <span className="size-2 rounded-full bg-primary" />
            {tag}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
