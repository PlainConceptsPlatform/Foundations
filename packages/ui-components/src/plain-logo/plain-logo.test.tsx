import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PlainLogo } from "./plain-logo";

describe("PlainLogo", () => {
  it("renders the original mark, wordmark, and lockup with responsive light/dark styling", () => {
    const html = renderToStaticMarkup(<PlainLogo />);

    expect(html).toContain('viewBox="0 0 64.309 64.025"');
    expect(html).toContain('viewBox="0 0 500 189"');
    expect(html).toContain('viewBox="0 0 635 171"');
    expect(html).toContain('fill="#2F69FF"');
    expect(html).toContain('fill="currentColor"');
    expect(html).toContain("@container (min-width: 190px)");
    expect(html).toContain("@container (min-width: 460px)");
    expect(html).toContain("color: var(--foreground, currentColor)");
  });
});
