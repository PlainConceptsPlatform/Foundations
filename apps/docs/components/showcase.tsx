/**
 * Showcase primitives for the token gallery and component pages.
 * These render the Platform tokens so reviewers see the real values.
 * Kept dependency-free on purpose; shadcn components get added per app via the CLI.
 */

type Swatch = { name: string; hex: string };

const NEUTRAL: Swatch[] = [
  { name: "0", hex: "#ffffff" },
  { name: "50", hex: "#fafafc" },
  { name: "100", hex: "#f2f3f7" },
  { name: "200", hex: "#e9eaf2" },
  { name: "300", hex: "#dfe1ec" },
  { name: "400", hex: "#8e8f95" },
  { name: "500", hex: "#6a6f74" },
  { name: "600", hex: "#4a4a4a" },
  { name: "700", hex: "#383838" },
  { name: "900", hex: "#0d0e0f" },
];

const BLUE: Swatch[] = [
  { name: "50", hex: "#f5f8ff" },
  { name: "100", hex: "#ebf0ff" },
  { name: "200", hex: "#dce6ff" },
  { name: "400", hex: "#5282ff" },
  { name: "500", hex: "#2f69ff" },
  { name: "600", hex: "#0043f0" },
  { name: "700", hex: "#0032b2" },
];

const FUNCTIONAL: Record<string, Swatch[]> = {
  Error: [
    { name: "100", hex: "#fde1e6" },
    { name: "300", hex: "#f99bac" },
    { name: "500", hex: "#f33859" },
    { name: "700", hex: "#c72e49" },
  ],
  Warning: [
    { name: "100", hex: "#feeec6" },
    { name: "300", hex: "#fddd8c" },
    { name: "500", hex: "#fbc740" },
    { name: "700", hex: "#a6842a" },
  ],
  Success: [
    { name: "100", hex: "#d8f1ef" },
    { name: "300", hex: "#9cdcd7" },
    { name: "500", hex: "#3abaaf" },
    { name: "700", hex: "#257770" },
  ],
  Info: [
    { name: "100", hex: "#e3f8ff" },
    { name: "300", hex: "#99e1f9" },
    { name: "500", hex: "#00b5f1" },
    { name: "700", hex: "#008ebd" },
  ],
};

function Row({ title, colors }: { title: string; colors: Swatch[] }) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <p style={{ fontWeight: 600, margin: "0 0 0.5rem" }}>{title}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
        {colors.map((c) => (
          <div key={c.name} style={{ textAlign: "center", fontSize: 11 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 8,
                background: c.hex,
                border: "1px solid rgb(0 0 0 / 0.1)",
              }}
            />
            <div style={{ marginTop: 4 }}>{c.name}</div>
            <div style={{ opacity: 0.6 }}>{c.hex}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Palette() {
  return (
    <div style={{ margin: "1rem 0" }}>
      <Row title="Neutral" colors={NEUTRAL} />
      <Row title="Brand blue (primary = 500)" colors={BLUE} />
      {Object.entries(FUNCTIONAL).map(([name, colors]) => (
        <Row key={name} title={`Functional / ${name}`} colors={colors} />
      ))}
    </div>
  );
}

export function TypeScale() {
  const rows = [
    { label: "H1", weight: 700, size: 20, lh: 25 },
    { label: "Paragraph L", weight: 400, size: 16, lh: 16 },
    { label: "Paragraph M", weight: 400, size: 14, lh: 24 },
    { label: "Paragraph S", weight: 400, size: 12, lh: 15 },
  ];
  return (
    <div style={{ margin: "1rem 0", display: "grid", gap: "1rem" }}>
      {rows.map((r) => (
        <div key={r.label}>
          <div style={{ fontSize: 12, opacity: 0.6 }}>
            {r.label} · Outfit {r.weight} · {r.size}/{r.lh}
          </div>
          <div
            style={{
              fontFamily: "var(--font-sans, Outfit, system-ui)",
              fontWeight: r.weight,
              fontSize: r.size,
              lineHeight: `${r.lh}px`,
            }}
          >
            The quick brown fox jumps over the lazy dog
          </div>
        </div>
      ))}
    </div>
  );
}

/** Themed buttons using semantic Tailwind tokens from the theme package. */
export function ButtonRow() {
  return (
    <div className="my-4 flex flex-wrap items-center gap-3">
      <button
        type="button"
        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
      >
        Primary
      </button>
      <button
        type="button"
        className="rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground"
      >
        Secondary
      </button>
      <button
        type="button"
        className="rounded-lg border border-input px-4 py-2 text-sm font-semibold text-foreground"
      >
        Outline
      </button>
      <button
        type="button"
        className="rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground"
      >
        Destructive
      </button>
      <button
        type="button"
        disabled
        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground opacity-50"
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
    <div className="my-4 flex flex-wrap gap-2">
      {states.map((s) => (
        <span key={s.label} className={`rounded-md px-2.5 py-1 text-xs font-medium ${s.cls}`}>
          {s.label}
        </span>
      ))}
    </div>
  );
}
