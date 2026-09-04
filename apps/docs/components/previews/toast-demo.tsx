"use client";

import { Button } from "@/components/ui/button";
import { Toast, ToastAction, ToastDescription, ToastTitle } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";

export function ToastDemo() {
  const { toast } = useToast();

  return (
    <div className="flex flex-wrap gap-3">
      <Button
        variant="outline"
        onClick={() => {
          toast({
            title: "Theme updated",
            description: "The Platform theme was applied successfully.",
          });
        }}
      >
        Show toast
      </Button>
      <Button
        variant="outline"
        onClick={() => {
          toast({
            variant: "destructive",
            title: "Something went wrong",
            description: "Failed to sync components. Please try again.",
            action: <ToastAction altText="Try again">Try again</ToastAction>,
          });
        }}
      >
        Show error
      </Button>
    </div>
  );
}
