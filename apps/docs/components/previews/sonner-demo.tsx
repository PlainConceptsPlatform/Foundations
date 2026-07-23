"use client"

import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"

export function SonnerDemo() {
  return (
    <>
      <Button
        variant="outline"
        onClick={() =>
          toast("Theme updated", {
            description: "The Platform theme was applied successfully.",
          })
        }
      >
        Show toast
      </Button>
      <Toaster />
    </>
  )
}
