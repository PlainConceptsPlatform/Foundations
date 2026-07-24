"use client";

import { Field } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

export function NativeSelectDemo() {
  return (
    <Field className="max-w-xs">
      <Label htmlFor="framework">Framework</Label>
      <NativeSelect id="framework" defaultValue="next">
        <NativeSelectOption value="next">Next.js</NativeSelectOption>
        <NativeSelectOption value="vite">Vite</NativeSelectOption>
        <NativeSelectOption value="remix">Remix</NativeSelectOption>
        <NativeSelectOption value="astro">Astro</NativeSelectOption>
      </NativeSelect>
    </Field>
  );
}
