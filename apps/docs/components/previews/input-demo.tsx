import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function InputDemo() {
  return (
    <div className="grid w-full max-w-sm gap-2">
      <Label htmlFor="email">Email</Label>
      <Input type="email" id="email" placeholder="you@example.com" />
    </div>
  )
}
