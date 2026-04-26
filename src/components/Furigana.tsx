import { useEffect, useState, type ReactNode } from "react";
import { useSettings } from "../hooks/useSettings";
import { toFurigana, hasKanji } from "../lib/furigana";

interface Furigana {
  text: string;
  /** Manually-annotated reading. When provided, used directly and kuroshiro is skipped. */
  reading?: string;
  className?: string;
}

/**
 * Convert kuroshiro's <ruby>/<rt>/<rp> HTML output into safe React nodes.
 *
 * SECURITY: kuroshiro preserves any non-Japanese characters in the input
 * verbatim, so a sentence like `漢<img onerror=x>字` would round-trip as raw
 * HTML. We must NEVER feed its output to dangerouslySetInnerHTML. Instead we
 * parse the string with a detached DOMParser document (which does not execute
 * scripts or fire <img> handlers) and rebuild the tree as React elements,
 * preserving only the ruby/rt/rp tags and dropping every attribute.
 */
function htmlToSafeRuby(html: string): ReactNode[] {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return Array.from(doc.body.childNodes).map((node, i) => nodeToReact(node, String(i)));
}

const ALLOWED_TAGS = new Set(["ruby", "rt", "rp"]);

function nodeToReact(node: Node, key: string): ReactNode {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent;
  if (node.nodeType !== Node.ELEMENT_NODE) return null;
  const el = node as Element;
  const tag = el.tagName.toLowerCase();
  const children = Array.from(el.childNodes).map((c, i) => nodeToReact(c, `${key}.${i}`));
  if (ALLOWED_TAGS.has(tag)) {
    // Drop every attribute — only the tag name itself is trusted.
    const Tag = tag as "ruby" | "rt" | "rp";
    return <Tag key={key}>{children}</Tag>;
  }
  // Unknown / disallowed tag → render its visible text content only.
  return <span key={key}>{el.textContent}</span>;
}

/**
 * Render Japanese text with hiragana ruby above kanji when the user has
 * enabled the furigana toggle. Falls back to plain text while the kuroshiro
 * dictionary is loading or when the toggle is off.
 */
export default function Furigana({ text, reading, className }: Furigana) {
  const { settings } = useSettings();
  const hasKanjiText = hasKanji(text);
  const enabled = settings.showFurigana && hasKanjiText;
  // Manual override is preferred over kuroshiro: skip the lazy loader entirely.
  const useManualReading = enabled && !!reading;
  const useAutoReading = enabled && !reading;

  const [resolved, setResolved] = useState<{ text: string; nodes: ReactNode[] } | null>(null);

  useEffect(() => {
    if (!useAutoReading) return;
    let cancelled = false;
    toFurigana(text)
      .then((html) => {
        if (cancelled) return;
        setResolved({ text, nodes: htmlToSafeRuby(html) });
      })
      .catch(() => { /* fall back to plain text */ });
    return () => { cancelled = true; };
  }, [text, useAutoReading]);

  if (useManualReading) {
    return (
      <span className={className}>
        <ruby>{text}<rt>{reading}</rt></ruby>
      </span>
    );
  }
  if (!useAutoReading || resolved === null || resolved.text !== text) {
    return <span className={className}>{text}</span>;
  }
  return <span className={className}>{resolved.nodes}</span>;
}
