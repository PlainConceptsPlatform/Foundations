import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export function LabelDemo() {
  return (
    <div className="flex items-center gap-2">
      <Checkbox id="label-demo" />
      <Label htmlFor="label-demo">Accept terms and conditions</Label>
    </div>
  )
}
