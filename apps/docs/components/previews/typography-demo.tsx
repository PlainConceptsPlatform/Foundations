export function TypographyDemo() {
  return (
    <div className="w-full max-w-2xl space-y-6">
      <article className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">Typography with Platform tokens</h1>
        <p className="text-muted-foreground">
          Every text element below inherits the Outfit family and the semantic color tokens from{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">
            @plainconceptsplatform/ui-theme
          </code>
          .
        </p>
      </article>

      <section className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Heading levels</h2>
        <div className="space-y-1">
          <h3 className="text-xl font-semibold">H3 — Section title</h3>
          <h4 className="text-lg font-semibold">H4 — Subsection title</h4>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Lists</h2>
        <ul className="list-disc space-y-1 pl-6 text-sm">
          <li>App-router by default</li>
          <li>shadcn/ui components, themed</li>
          <li>Tokens shared across apps</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Blockquote</h2>
        <blockquote className="border-l-2 border-primary pl-4 text-sm italic text-muted-foreground">
          Prefer shadcn/ui and the ARCHITECTURE.md libraries. Use components directly; never wrap
          them without a real reason.
        </blockquote>
      </section>

      <section className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Inline code</h2>
        <p className="text-sm">
          Run <code className="rounded bg-muted px-1 py-0.5 text-sm">pnpm dev</code> to start the
          docs site.
        </p>
      </section>
    </div>
  );
}
