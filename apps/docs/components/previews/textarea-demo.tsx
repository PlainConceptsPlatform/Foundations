import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function TextareaDemo() {
  return (
    <div className="grid w-full max-w-sm gap-2">
      <Label htmlFor="message">Message</Label>
      <Textarea id="message" placeholder="Type your message here." />
    </div>
  )
}
