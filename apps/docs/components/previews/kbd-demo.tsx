import { Kbd, KbdGroup } from "@/components/ui/kbd";

export function KbdDemo() {
  return (
    <div className="flex flex-col items-start gap-3 text-sm text-muted-foreground">
      <span>
        Press <Kbd>⌘</Kbd> <Kbd>K</Kbd> to open the command palette.
      </span>
      <span>
        Toggle the sidebar with{" "}
        <KbdGroup>
          <Kbd>⌘</Kbd>
          <Kbd>B</Kbd>
        </KbdGroup>
      </span>
      <span>
        Submit the form with <Kbd>Enter</Kbd>.
      </span>
    </div>
  );
}
