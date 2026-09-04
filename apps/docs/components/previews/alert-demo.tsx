import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

export function AlertDemo() {
  return (
    <Alert className="max-w-md">
      <Info />
      <AlertTitle>Heads up</AlertTitle>
      <AlertDescription>Add components to your app with the shadcn CLI.</AlertDescription>
    </Alert>
  );
}
