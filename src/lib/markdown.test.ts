// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { countWords, renderMarkdown } from "./markdown";

describe("renderMarkdown", () => {
  it("matches the server: h1 becomes h2, ids are unique, scripts are stripped", () => {
    const { html, toc } = renderMarkdown("# Intro\n\n## Intro\n\n<script>alert(1)</script><img src=x onerror=alert(1)>");
    expect(toc).toEqual([
      { id: "intro", text: "Intro", level: 2 },
      { id: "intro-2", text: "Intro", level: 2 },
    ]);
    expect(html).not.toMatch(/script|onerror/);
  });
  it("counts words the same way as the server", () => {
    expect(countWords("First *para* here.\n\n[site](https://example.com)\n\n```js\nconst a = 1;\n```")).toEqual({ words: 4, minutes: 1 });
  });
});
