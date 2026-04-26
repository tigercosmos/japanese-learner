import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import Furigana from "../Furigana";

vi.mock("../../lib/furigana", () => ({
  toFurigana: vi.fn(),
  hasKanji: (s: string) => /[一-龯]/.test(s),
}));

import { toFurigana } from "../../lib/furigana";

const mockedConvert = toFurigana as unknown as ReturnType<typeof vi.fn>;

function enableFurigana() {
  localStorage.setItem(
    "jp-learner:settings",
    JSON.stringify({ defaultSessionSize: 20, showSwipeAssist: true, showFurigana: true }),
  );
}

function disableFurigana() {
  localStorage.setItem(
    "jp-learner:settings",
    JSON.stringify({ defaultSessionSize: 20, showSwipeAssist: true, showFurigana: false }),
  );
}

describe("Furigana XSS safety", () => {
  beforeEach(() => {
    delete (window as unknown as { __pwned?: number }).__pwned;
    mockedConvert.mockReset();
  });

  it("strips <img onerror> injected alongside ruby", async () => {
    enableFurigana();
    mockedConvert.mockResolvedValue(
      '<ruby>漢<rt>かん</rt></ruby><img src=x onerror="window.__pwned=1"><ruby>字<rt>じ</rt></ruby>',
    );

    const { container } = render(<Furigana text="漢字" />);
    await waitFor(() => expect(container.querySelector("ruby")).not.toBeNull());

    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelectorAll("ruby")).toHaveLength(2);
    expect((window as unknown as { __pwned?: number }).__pwned).toBeUndefined();
  });

  it("strips <script> from converter output", async () => {
    enableFurigana();
    mockedConvert.mockResolvedValue(
      '<ruby>漢<rt>かん</rt></ruby><script>window.__pwned=2</script>',
    );

    const { container } = render(<Furigana text="漢" />);
    await waitFor(() => expect(container.querySelector("ruby")).not.toBeNull());

    expect(container.querySelector("script")).toBeNull();
    expect((window as unknown as { __pwned?: number }).__pwned).toBeUndefined();
  });

  it("drops every attribute on allowed ruby/rt tags", async () => {
    enableFurigana();
    mockedConvert.mockResolvedValue(
      '<ruby onclick="window.__pwned=3" class="evil">漢<rt onmouseover="window.__pwned=4">かん</rt></ruby>',
    );

    const { container } = render(<Furigana text="漢" />);
    await waitFor(() => expect(container.querySelector("ruby")).not.toBeNull());

    const ruby = container.querySelector("ruby")!;
    expect(ruby.getAttribute("onclick")).toBeNull();
    expect(ruby.getAttribute("class")).toBeNull();
    const rt = container.querySelector("rt")!;
    expect(rt.getAttribute("onmouseover")).toBeNull();
  });

  it("renders plain (escaped) text when toggle is off — never runs the converter", () => {
    disableFurigana();
    const malicious = '<img src=x onerror="window.__pwned=5">';

    const { container } = render(<Furigana text={malicious} />);

    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toBe(malicious);
    expect(mockedConvert).not.toHaveBeenCalled();
  });

  it("does not invoke the converter when input has no kanji", () => {
    enableFurigana();
    const { container } = render(<Furigana text="ひらがなだけ" />);

    expect(container.textContent).toBe("ひらがなだけ");
    expect(mockedConvert).not.toHaveBeenCalled();
  });

  it("falls back to plain text when toFurigana rejects", async () => {
    enableFurigana();
    mockedConvert.mockRejectedValue(new Error("dict load failed"));

    const { container } = render(<Furigana text="漢字" />);
    // Wait a tick for the rejected promise to settle.
    await Promise.resolve();
    await Promise.resolve();

    expect(container.querySelector("ruby")).toBeNull();
    expect(container.textContent).toBe("漢字");
  });
});

describe("Furigana manual reading override", () => {
  beforeEach(() => {
    mockedConvert.mockReset();
  });

  it("renders <ruby> with the supplied reading and skips the converter", () => {
    enableFurigana();
    const { container } = render(<Furigana text="方" reading="かた" />);

    const ruby = container.querySelector("ruby");
    expect(ruby).not.toBeNull();
    const rt = ruby!.querySelector("rt");
    expect(rt?.textContent).toBe("かた");
    expect(ruby!.textContent).toBe("方かた");
    expect(mockedConvert).not.toHaveBeenCalled();
  });

  it("ignores manual reading when the toggle is off", () => {
    disableFurigana();
    const { container } = render(<Furigana text="方" reading="かた" />);

    expect(container.querySelector("ruby")).toBeNull();
    expect(container.textContent).toBe("方");
    expect(mockedConvert).not.toHaveBeenCalled();
  });

  it("escapes HTML in the manual reading (no XSS via reading attr)", () => {
    enableFurigana();
    const { container } = render(<Furigana text="漢" reading={'<img src=x onerror="window.__pwned=9">'} />);

    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("rt")?.textContent).toBe('<img src=x onerror="window.__pwned=9">');
    expect((window as unknown as { __pwned?: number }).__pwned).toBeUndefined();
  });
});
