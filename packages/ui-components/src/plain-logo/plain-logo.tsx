import { cn } from "../lib/utils";
import { LOCKUP, MARK, WORDMARK } from "./logo-svgs";

function LogoSvg({ html, className }: { html: string; className?: string }) {
  // Some SVG editors add an XML declaration and duplicate style fragments that
  // are invalid once the SVG is embedded in HTML.
  const svg = html
    .replace(/<\?xml[^>]*\?>\s*/i, "")
    .replace(/ fill-rule="nonzero"#2F69FF";fill-opacity:1;"/g, ' fill-rule="nonzero"');

  return (
    <span
      role="img"
      aria-label="Plain"
      className={className}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

export function PlainLogo({ className }: { className?: string }) {
  return (
    <div className={cn("pc-plain-logo", className)}>
      <style>{`
        .pc-plain-logo { container-type: inline-size; display: flex; width: 100%; align-items: center; color: var(--foreground, currentColor); }
        .pc-plain-logo svg { display: block; height: 100%; width: auto; }
        .pc-plain-logo__mark { display: inline-block; height: 2rem; }
        .pc-plain-logo__wordmark, .pc-plain-logo__lockup { display: none; }
        @container (min-width: 190px) {
          .pc-plain-logo__mark { display: none; }
          .pc-plain-logo__wordmark { display: inline-block; height: 1.75rem; }
        }
        @container (min-width: 460px) {
          .pc-plain-logo__wordmark { display: none; }
          .pc-plain-logo__lockup { display: inline-block; height: 2.25rem; }
        }
      `}</style>
      <LogoSvg html={MARK} className="pc-plain-logo__mark" />
      <LogoSvg html={WORDMARK} className="pc-plain-logo__wordmark" />
      <LogoSvg html={LOCKUP} className="pc-plain-logo__lockup" />
    </div>
  );
}
