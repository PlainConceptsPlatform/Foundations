import { Info } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function AlertDemo() {
  return (
    <Alert className="max-w-md">
      <Info />
      <AlertTitle>Heads up</AlertTitle>
      <AlertDescription>
        Add components to your app with the shadcn CLI.
      </AlertDescription>
    </Alert>
  )
}
