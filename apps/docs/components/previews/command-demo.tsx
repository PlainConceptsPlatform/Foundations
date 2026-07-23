import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"

export function CommandDemo() {
  return (
    <Command className="max-w-md rounded-lg border">
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Suggestions">
          <CommandItem>Tokens</CommandItem>
          <CommandItem>Components</CommandItem>
          <CommandItem>Examples</CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Docs">
          <CommandItem>Architecture</CommandItem>
          <CommandItem>Design guidelines</CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  )
}
