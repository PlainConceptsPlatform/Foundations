import { AspectRatio } from "@/components/ui/aspect-ratio";

export function AspectRatioDemo() {
  return (
    <AspectRatio ratio={16 / 9} className="w-full max-w-sm overflow-hidden rounded-md bg-muted">
      <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/15 to-accent text-sm text-muted-foreground">
        16 : 9
      </div>
    </AspectRatio>
  );
}
