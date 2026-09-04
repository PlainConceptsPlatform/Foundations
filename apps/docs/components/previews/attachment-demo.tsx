"use client";

import {
  Attachment,
  AttachmentAction,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from "@/components/ui/attachment";
import { Spinner } from "@/components/ui/spinner";
import { FileText } from "lucide-react";

export function AttachmentDemo() {
  return (
    <div className="flex flex-wrap gap-3">
      <Attachment state="done">
        <AttachmentMedia variant="icon">
          <FileText />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>proposal.pdf</AttachmentTitle>
          <AttachmentDescription>1.2 MB</AttachmentDescription>
        </AttachmentContent>
      </Attachment>

      <Attachment state="uploading">
        <AttachmentMedia variant="icon">
          <Spinner />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>uploading-design.png</AttachmentTitle>
          <AttachmentDescription>Uploading 64%</AttachmentDescription>
        </AttachmentContent>
      </Attachment>

      <Attachment state="error" size="sm">
        <AttachmentMedia variant="icon">
          <FileText />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>failed.txt</AttachmentTitle>
          <AttachmentDescription>Upload failed</AttachmentDescription>
        </AttachmentContent>
      </Attachment>
    </div>
  );
}
