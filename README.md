# Folio

A small magazine with a real editorial desk: writers draft in Markdown and submit, editors approve, send back with notes, or decline. Live at **[blog.hetdelwadiya.dev](https://blog.hetdelwadiya.dev)**.

API: [blog-backend](https://github.com/het-delwadiya/blog-backend)

## Features

- **Reading:** editorial front page, article pages with a reading-progress bar, a table of contents that follows your scroll, responses, a reading list, topics, writer pages and full-text search.
- **Writing:** Markdown editor with a formatting toolbar and keyboard shortcuts, a live split preview that matches the published page, autosave, cover and inline image uploads (paste or drop), topics, and the editor's notes right where you revise.
- **Editing:** a review queue, a word-level diff of what changed since the last review, approve / request changes / decline with a note, and the full review history.
- **Try it without an account:** demo writer and demo editor logins. Demo work is only visible to demo sessions and resets on its own.

## Stack

React 19, TypeScript, Vite, Tailwind CSS 4, React Router 7, TanStack Query, Zustand, Motion, marked + DOMPurify, jsdiff, Phosphor icons. Type is Newsreader and Geist.

## Development

```bash
npm install
npm run dev      # http://localhost:5175, expects the API on :8010
npm test
npm run build
```

Set `VITE_API_URL` to point at another API (default `http://localhost:8010/blog/api`).

## License

GPL-3.0
