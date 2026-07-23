import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function AvatarDemo() {
  return (
    <div className="flex gap-3">
      <Avatar>
        <AvatarImage src="https://github.com/shadcn.png" alt="Avatar" />
        <AvatarFallback>PC</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>PF</AvatarFallback>
      </Avatar>
    </div>
  )
}
