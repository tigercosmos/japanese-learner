/**
 * Furigana conversion via kuroshiro + kuromoji. Lazy-loaded so the ~3MB
 * dictionary is only fetched when the user enables the toggle.
 *
 * Returns HTML string with <ruby><rt>...</rt></ruby> markup; intended to be
 * injected via dangerouslySetInnerHTML in a small dedicated component.
 */

let instancePromise: Promise<KuroshiroLike> | null = null;

interface KuroshiroLike {
  convert(
    str: string,
    options: { to: string; mode: string },
  ): Promise<string>;
}

async function getInstance(): Promise<KuroshiroLike> {
  if (!instancePromise) {
    instancePromise = (async () => {
      const [kuroshiroMod, analyzerMod] = await Promise.all([
        import("@sglkc/kuroshiro"),
        import("@sglkc/kuroshiro-analyzer-kuromoji"),
      ]);
      // Both packages publish ESM with default export; the bundled .d.ts
      // uses `export =` which doesn't line up with verbatimModuleSyntax,
      // so cast through unknown to keep TS quiet without leaking `any`.
      const Kuroshiro = (kuroshiroMod as unknown as { default: new () => KuroshiroLike & { init(a: unknown): Promise<void> } }).default;
      const KuromojiAnalyzer = (analyzerMod as unknown as { default: new (opts: { dictPath: string }) => unknown }).default;
      const k = new Kuroshiro();
      await k.init(new KuromojiAnalyzer({ dictPath: `${import.meta.env.BASE_URL}dict/` }));
      return k;
    })().catch((err) => {
      // Reset so a later attempt can retry; surface the error to the caller.
      instancePromise = null;
      throw err;
    });
  }
  return instancePromise;
}

const cache = new Map<string, string>();

export async function toFurigana(text: string): Promise<string> {
  if (!text) return text;
  const cached = cache.get(text);
  if (cached !== undefined) return cached;
  const k = await getInstance();
  const html = await k.convert(text, { to: "hiragana", mode: "furigana" });
  cache.set(text, html);
  return html;
}

const KANJI_RE = /[一-龯㐀-䶿]/;

export function hasKanji(text: string): boolean {
  return KANJI_RE.test(text);
}
