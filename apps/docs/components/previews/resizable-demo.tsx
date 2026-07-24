import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

export function ResizableDemo() {
  return (
    <ResizablePanelGroup orientation="horizontal" className="max-w-md rounded-lg border">
      <ResizablePanel defaultSize={50}>
        <div className="flex h-[180px] items-center justify-center p-4 text-center text-sm">
          Left panel
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={50}>
        <div className="flex h-[180px] items-center justify-center p-4 text-center text-sm">
          Right panel
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
