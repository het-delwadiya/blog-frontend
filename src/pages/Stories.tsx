import { ArrowLeft, ArrowRight, MagnifyingGlass } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { StoryRow, StoryRowSkeleton } from "../components/StoryCard";
import { Container, EmptyState, ErrorNote, Input, buttonClass, cx } from "../components/ui";
import { useStories } from "../hooks";
import { plural } from "../lib/format";

export function Pager({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void }) {
  if (pages <= 1) return null;
  return (
    <nav aria-label="Pages" className="mt-8 flex items-center justify-between border-t border-ink pt-5">
      <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} className={buttonClass("ghost", "sm")}>
        <ArrowLeft size={16} /> Newer
      </button>
      <span className="text-sm text-muted">
        Page {page} of {pages}
      </span>
      <button type="button" disabled={page >= pages} onClick={() => onPage(page + 1)} className={buttonClass("ghost", "sm")}>
        Older <ArrowRight size={16} />
      </button>
    </nav>
  );
}

export default function Stories({ mode }: { mode: "all" | "topic" | "search" }) {
  const { tag } = useParams();
  const [params, setParams] = useSearchParams();
  const page = Number(params.get("page")) || 1;
  const q = params.get("q") ?? "";
  const [draft, setDraft] = useState(q);
  useEffect(() => {
    setDraft(q);
  }, [q]);

  const enabled = mode !== "search" || q.length > 0;
  const { data, isPending, error, refetch } = useStories({ tag: mode === "topic" ? tag : undefined, q: mode === "search" ? q : undefined, page, limit: 10 }, enabled);

  const setPage = (p: number) => {
    const next = new URLSearchParams(params);
    next.set("page", String(p));
    setParams(next);
  };

  const heading = mode === "topic" ? tag : mode === "search" ? "Search" : "All stories";

  return (
    <Container className="max-w-[880px] pt-12">
      {mode === "topic" && (
        <Link to="/topics" className="text-[13px] text-muted hover:text-accent">
          Topics
        </Link>
      )}
      <h1 className={cx("headline mt-1 text-5xl sm:text-6xl", mode === "topic" && "capitalize")}>{heading}</h1>

      {mode === "search" && (
        <form
          role="search"
          className="relative mt-8"
          onSubmit={(e) => {
            e.preventDefault();
            setParams(draft.trim() ? { q: draft.trim() } : {});
          }}
        >
          <MagnifyingGlass size={20} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted" />
          <label htmlFor="q" className="sr-only">Search stories</label>
          <Input id="q" autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Try sourdough, maps or typefaces" className="h-14 rounded-full pl-12 font-serif text-lg" />
        </form>
      )}

      {enabled && data && !isPending && (
        <p className="mt-6 border-b border-ink pb-3 text-sm text-muted">
          {mode === "search" ? `${plural(data.total, "result")} for “${q}”` : plural(data.total, "story")}
        </p>
      )}

      {error ? (
        <div className="mt-8"><ErrorNote error={error} onRetry={() => refetch()} /></div>
      ) : !enabled ? (
        <p className="mt-10 font-serif text-xl text-ink-2">Search titles, summaries, topics and the full text of every published story.</p>
      ) : isPending ? (
        <div className="divide-y divide-line">{[0, 1, 2, 3].map((i) => <StoryRowSkeleton key={i} />)}</div>
      ) : data.items.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="Nothing matched" body={mode === "search" ? "Try a shorter or more general word. Search matches whole words, so “bread” finds more than “breadmaking”." : "No stories here yet."} />
        </div>
      ) : (
        <>
          <div className="divide-y divide-line">
            {data.items.map((s) => <StoryRow key={s._id} story={s} />)}
          </div>
          <Pager page={data.page} pages={data.pages} onPage={setPage} />
        </>
      )}
    </Container>
  );
}
