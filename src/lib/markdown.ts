import DOMPurify from "dompurify";
import hljs from "highlight.js/lib/common";
import { Marked } from "marked";
import { markedHighlight } from "marked-highlight";
import type { TocItem } from "./types";

// Mirrors the server renderer (folio-api src/lib/markdown.js) so the live preview matches what gets published.
export const slugify = (s = "") =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

const stripTags = (html: string) => {
  const el = document.createElement("div");
  el.innerHTML = html;
  return el.textContent ?? "";
};

export function renderMarkdown(md: string) {
  const toc: TocItem[] = [];
  const seen = new Map<string, number>();
  const marked = new Marked(
    markedHighlight({
      langPrefix: "hljs language-",
      highlight: (code, lang) => hljs.highlight(code, { language: hljs.getLanguage(lang) ? lang : "plaintext" }).value,
    }),
    {
      gfm: true,
      renderer: {
        heading({ tokens, depth }) {
          const inner = this.parser.parseInline(tokens);
          const level = Math.min(Math.max(depth, 2), 4);
          const text = stripTags(inner).trim();
          const base = slugify(text) || "section";
          const n = (seen.get(base) || 0) + 1;
          seen.set(base, n);
          const id = n > 1 ? `${base}-${n}` : base;
          if (level <= 3) toc.push({ id, text, level });
          return `<h${level} id="${id}">${inner}</h${level}>\n`;
        },
      },
    },
  );
  const html = DOMPurify.sanitize(marked.parse(md, { async: false }), { FORBID_TAGS: ["style", "form", "input", "iframe"], FORBID_ATTR: ["style"] });
  return { html, toc };
}

export function countWords(md: string) {
  const plain = md.replace(/```[\s\S]*?```/g, " ").replace(/\]\([^)]*\)/g, " ").replace(/[#>*_`~\-[\]()!|]/g, " ");
  const words = plain.split(/\s+/).filter(Boolean).length;
  return { words, minutes: Math.max(1, Math.round(words / 230)) };
}
