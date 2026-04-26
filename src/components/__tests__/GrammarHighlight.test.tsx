import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import GrammarHighlight from "../GrammarHighlight";

// Bypass the kuroshiro lazy loader, but keep `hasKanji` realistic so the
// `<ruby>` path is exercised when manual readings are present.
vi.mock("../../lib/furigana", () => ({
  toFurigana: vi.fn(),
  hasKanji: (s: string) => /[一-龯]/.test(s),
}));

describe("GrammarHighlight wrapping", () => {
  it("renders ONE highlight pill spanning the whole 【】 even when fragmented by inner furigana", () => {
    const { container } = render(
      <GrammarHighlight sentence="本を【{読んで|よんで}ください】" mode="highlight" />,
    );

    const pills = container.querySelectorAll('[data-testid="grammar-pill"]');
    expect(pills).toHaveLength(1);
    expect(pills[0].textContent).toBe("読んでください");
  });

  it("renders ONE blank for a 【】 with inner furigana annotations", () => {
    const { container } = render(
      <GrammarHighlight sentence="本を【{読んで|よんで}ください】" mode="blank" />,
    );

    const blanks = container.querySelectorAll('[data-testid="grammar-blank"]');
    expect(blanks).toHaveLength(1);
    expect(blanks[0].textContent).toBe("____");
  });

  it("renders one pill per 【】 across separated brackets", () => {
    const { container } = render(
      <GrammarHighlight sentence="東京【から】大阪【にかけて】雨が降る" mode="highlight" />,
    );

    const pills = container.querySelectorAll('[data-testid="grammar-pill"]');
    expect(pills).toHaveLength(2);
    expect(pills[0].textContent).toBe("から");
    expect(pills[1].textContent).toBe("にかけて");
  });

  it("renders TWO pills for adjacent 【X】【Y】 with no separator (highlight mode)", () => {
    const { container } = render(
      <GrammarHighlight sentence="A【X】【Y】B" mode="highlight" />,
    );

    const pills = container.querySelectorAll('[data-testid="grammar-pill"]');
    expect(pills).toHaveLength(2);
    expect(pills[0].textContent).toBe("X");
    expect(pills[1].textContent).toBe("Y");
  });

  it("renders TWO blanks for adjacent 【X】【Y】 with no separator (blank mode)", () => {
    const { container } = render(
      <GrammarHighlight sentence="A【X】【Y】B" mode="blank" />,
    );

    const blanks = container.querySelectorAll('[data-testid="grammar-blank"]');
    expect(blanks).toHaveLength(2);
  });

  it("renders no pills/blanks for a sentence with no 【】", () => {
    const { container } = render(
      <GrammarHighlight sentence="普通の文" mode="highlight" />,
    );

    expect(container.querySelectorAll('[data-testid="grammar-pill"]')).toHaveLength(0);
    expect(container.querySelectorAll('[data-testid="grammar-blank"]')).toHaveLength(0);
    expect(container.textContent).toBe("普通の文");
  });

  it("renders <ruby> with manual reading INSIDE the highlight pill", () => {
    // Enable furigana so the manual-reading path actually runs.
    localStorage.setItem(
      "jp-learner:settings",
      JSON.stringify({ defaultSessionSize: 20, showSwipeAssist: true, showFurigana: true }),
    );

    const { container } = render(
      <GrammarHighlight sentence="【{知って|しって}いる】" mode="highlight" />,
    );

    const pill = container.querySelector('[data-testid="grammar-pill"]');
    expect(pill).not.toBeNull();
    const ruby = pill!.querySelector("ruby");
    expect(ruby).not.toBeNull();
    expect(pill!.querySelector("rt")?.textContent).toBe("しって");
    // The reading must live inside the pill, not as a sibling.
    expect(pill!.textContent).toBe("知ってしっている");
  });
});
