"use client";

/**
 * Token gallery. Every value is read from lib/tokens.generated.ts, which is derived
 * from packages/theme/src/theme.css, so the page cannot drift from the theme it
 * documents (it used to hardcode all 25 hexes as JS literals).
 *
 * Clicking a swatch copies the *token name*, not the hex. That is deliberate: the
 * rule this page teaches is "never hardcode a value", so handing out hexes would
 * undercut it.
 */

import { useToast } from "@/hooks/use-toast";
import { type SemanticSlot, tokens } from "@/lib/tokens.generated";

const RAMP_LABELS: Record<string, string> = {
  blue: "Brand blue",
  neutral: "Neutral",
  error: "Functional / Error",
  warning: "Functional / Warning",
  success: "Functional / Success",
  info: "Functional / Info",
};

/** Semantic slots worth showing, in reading order. The rest are -foreground pairs. */
const FEATURED = [
  "--background",
  "--foreground",
  "--card",
  "--primary",
  "--secondary",
  "--muted",
  "--muted-foreground",
  "--accent",
  "--accent-foreground",
  "--destructive",
  "--success",
  "--warning",
  "--info",
  "--border",
  "--input",
  "--ring",
];

function useCopyToken() {
  const { toast } = useToast();

  return (token: string) => {
    navigator.clipboard?.writeText(token).then(
      () => toast({ title: "Copied", description: token }),
      () => toast({ title: "Could not copy", description: token }),
    );
  };
}

function Swatch({
  label,
  sublabel,
  hex,
  copyValue,
  onCopy,
}: {
  label: string;
  sublabel?: string;
  hex: string;
  copyValue: string;
  onCopy: (value: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onCopy(copyValue)}
      title={`Copy ${copyValue}`}
      className="group flex w-[5.5rem] flex-col gap-1 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span
        aria-hidden
        style={{ backgroundColor: hex }}
        className="h-14 w-full rounded-md border border-border transition-colors duration-150 group-hover:border-primary/50"
      />
      <span className="font-medium text-[11px] text-foreground">{label}</span>
      {sublabel ? (
        <span className="font-mono text-[10px] text-muted-foreground">{sublabel}</span>
      ) : null}
    </button>
  );
}

/** Primitive ramps. Copy value is the CSS custom property, e.g. --pc-blue-500. */
export function Palette() {
  const copy = useCopyToken();

  return (
    <div className="my-6 flex flex-col gap-6 not-prose">
      {Object.entries(tokens.ramps).map(([family, steps]) => (
        <section key={family}>
          <h4 className="mb-2 font-semibold text-sm">{RAMP_LABELS[family] ?? family}</h4>
          <div className="flex flex-wrap gap-2">
            {steps.map((swatch) => (
              <Swatch
                key={swatch.step}
                label={swatch.step}
                sublabel={swatch.hex}
                hex={swatch.hex}
                copyValue={`--pc-${family}-${swatch.step}`}
                onCopy={copy}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function slotRows(mode: "light" | "dark"): SemanticSlot[] {
  const bySlot = new Map(tokens.semantic[mode].map((slot) => [slot.token, slot]));
  return FEATURED.map((token) => bySlot.get(token)).filter((slot): slot is SemanticSlot =>
    Boolean(slot),
  );
}

/**
 * Semantic slots side by side in both modes. This is the layer app code consumes,
 * and seeing light next to dark is what makes the derived dark palette reviewable.
 */
export function SemanticTokens() {
  const copy = useCopyToken();
  const light = slotRows("light");
  const dark = new Map(tokens.semantic.dark.map((slot) => [slot.token, slot]));

  return (
    <div className="my-6 overflow-x-auto not-prose">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-border border-b text-left">
            <th className="py-2 pr-4 font-semibold">Token</th>
            <th className="py-2 pr-4 font-semibold">Light</th>
            <th className="py-2 pr-4 font-semibold">Dark</th>
            <th className="py-2 font-semibold">Resolves to</th>
          </tr>
        </thead>
        <tbody>
          {light.map((slot) => {
            const darkSlot = dark.get(slot.token);
            return (
              <tr key={slot.token} className="border-border/60 border-b last:border-0">
                <td className="py-2 pr-4">
                  <button
                    type="button"
                    onClick={() => copy(slot.token)}
                    title={`Copy ${slot.token}`}
                    className="rounded font-mono text-xs transition-colors duration-150 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {slot.token}
                  </button>
                </td>
                <td className="py-2 pr-4">
                  <span className="flex items-center gap-2">
                    <span
                      aria-hidden
                      style={{ backgroundColor: slot.hex }}
                      className="size-4 shrink-0 rounded border border-border"
                    />
                    <span className="font-mono text-muted-foreground text-xs">{slot.hex}</span>
                  </span>
                </td>
                <td className="py-2 pr-4">
                  {darkSlot ? (
                    <span className="flex items-center gap-2">
                      <span
                        aria-hidden
                        style={{ backgroundColor: darkSlot.hex }}
                        className="size-4 shrink-0 rounded border border-border"
                      />
                      <span className="font-mono text-muted-foreground text-xs">
                        {darkSlot.hex}
                      </span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-xs">inherits light</span>
                  )}
                </td>
                <td className="py-2 font-mono text-muted-foreground text-xs">
                  {slot.ref ?? "literal"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Type scale, rendered at the real sizes from the DESIGN.md scale. */
export function TypeScale() {
  return (
    <div className="my-6 grid gap-4 not-prose">
      {tokens.typography.scale.map((step) => (
        <div key={step.name}>
          <p className="mb-1 font-mono text-muted-foreground text-xs">
            {step.name} · {tokens.typography.family} {step.weight} · {step.size}/{step.lineHeight}
          </p>
          <p
            style={{
              fontWeight: step.weight,
              fontSize: `${step.size}px`,
              lineHeight: `${step.lineHeight}px`,
            }}
            className="text-foreground"
          >
            The quick brown fox jumps over the lazy dog
          </p>
        </div>
      ))}
    </div>
  );
}

/** The categorical data-viz ramp, with its contrast rationale visible. */
export function ChartRamp() {
  const copy = useCopyToken();
  const light = tokens.semantic.light.filter((slot) => /^--chart-\d$/.test(slot.token));

  return (
    <div className="my-6 flex flex-wrap gap-2 not-prose">
      {light.map((slot) => (
        <Swatch
          key={slot.token}
          label={slot.token.replace("--", "")}
          sublabel={slot.hex}
          hex={slot.hex}
          copyValue={slot.token}
          onCopy={copy}
        />
      ))}
    </div>
  );
}

/** Themed buttons using semantic Tailwind tokens from the theme package. */
export function ButtonRow() {
  return (
    <div className="my-4 flex flex-wrap items-center gap-3 not-prose">
      <button
        type="button"
        className="rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground text-sm"
      >
        Primary
      </button>
      <button
        type="button"
        className="rounded-lg bg-secondary px-4 py-2 font-semibold text-secondary-foreground text-sm"
      >
        Secondary
      </button>
      <button
        type="button"
        className="rounded-lg border border-input px-4 py-2 font-semibold text-foreground text-sm"
      >
        Outline
      </button>
      <button
        type="button"
        className="rounded-lg bg-destructive px-4 py-2 font-semibold text-destructive-foreground text-sm"
      >
        Destructive
      </button>
      <button
        type="button"
        disabled
        className="rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground text-sm opacity-50"
      >
        Disabled
      </button>
    </div>
  );
}

/** Status feedback using the functional tokens. */
export function StatePreview() {
  const states = [
    { label: "Success", cls: "bg-success text-success-foreground" },
    { label: "Warning", cls: "bg-warning text-warning-foreground" },
    { label: "Info", cls: "bg-info text-info-foreground" },
    { label: "Error", cls: "bg-destructive text-destructive-foreground" },
  ];

  return (
    <div className="my-4 flex flex-wrap gap-2 not-prose">
      {states.map((state) => (
        <span
          key={state.label}
          className={`rounded-md px-2.5 py-1 font-medium text-xs ${state.cls}`}
        >
          {state.label}
        </span>
      ))}
    </div>
  );
}
