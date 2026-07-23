import { Separator } from "@/components/ui/separator"

export function SeparatorDemo() {
  return (
    <div className="max-w-sm">
      <div className="space-y-1">
        <h4 className="text-sm font-medium">Platform Foundations</h4>
        <p className="text-sm text-muted-foreground">Theme, conventions, docs, showcase.</p>
      </div>
      <Separator className="my-4" />
      <div className="flex h-5 items-center gap-4 text-sm">
        <span>Frontend</span>
        <Separator orientation="vertical" />
        <span>Backend</span>
        <Separator orientation="vertical" />
        <span>Docs</span>
      </div>
    </div>
  )
}
