import type { ReactNode } from "react";

/**
 * The framed surface every component demo renders on.
 *
 * Each of the 63 catalog pages used to hand-write its own bordered <div>, so the
 * padding and border drifted between pages and there was no way to restyle them all.
 * The generator now emits this instead, which means one edit here restyles the whole
 * catalog.
 *
 * Deliberately a server component: the demos it wraps bring their own "use client"
 * where they need it, and the frame itself has no interactivity.
 */
export function ComponentPreview({
  children,
  /** Vertically stack instead of centering. For demos that are full-width blocks. */
  block = false,
}: {
  children: ReactNode;
  block?: boolean;
}) {
  return (
    <div
      className={[
        "not-prose min-h-[8rem] rounded-lg border border-border bg-card p-6",
        block ? "flex flex-col gap-4" : "flex flex-wrap items-center gap-4",
      ].join(" ")}
    >
      {children}
    </div>
  );
}
