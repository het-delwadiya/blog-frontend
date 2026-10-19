import { useParams, useSearchParams } from "react-router";
import { StoryRow, StoryRowSkeleton } from "../components/StoryCard";
import { Avatar, Container, EmptyState, ErrorNote, Skeleton } from "../components/ui";
import { useProfile, useStories } from "../hooks";
import { plural } from "../lib/format";
import NotFound from "./NotFound";
import { Pager } from "./Stories";

export default function Writer() {
  const { handle } = useParams();
  const [params, setParams] = useSearchParams();
  const page = Number(params.get("page")) || 1;
  const profile = useProfile(handle);
  const stories = useStories({ author: handle, page, limit: 10 });

  if (profile.error) return <NotFound title="No writer by that name" body="They may have changed their handle." />;
  const p = profile.data;

  return (
    <Container className="max-w-[880px] pt-12">
      <header className="flex flex-col gap-6 border-b border-ink pb-10 sm:flex-row sm:items-center">
        {p ? <Avatar user={p} size={112} className="text-4xl" /> : <Skeleton className="size-28 rounded-full" />}
        <div className="flex flex-col gap-3">
          {p ? (
            <>
              <p className="text-[13px] text-muted capitalize">
                {p.demo ? `Demo ${p.role}` : p.role}
                {p.stories > 0 && ` · ${plural(p.stories, "story")}, ${plural(p.words, "word")}`}
              </p>
              <h1 className="headline text-5xl">{p.name}</h1>
              {p.bio && <p className="max-w-[52ch] font-serif text-xl leading-snug text-ink-2">{p.bio}</p>}
            </>
          ) : (
            <>
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-12 w-72" />
              <Skeleton className="h-5 w-96 max-w-full" />
            </>
          )}
        </div>
      </header>
      {stories.error ? (
        <div className="mt-8"><ErrorNote error={stories.error} onRetry={() => stories.refetch()} /></div>
      ) : stories.isPending ? (
        <div className="divide-y divide-line">{[0, 1].map((i) => <StoryRowSkeleton key={i} />)}</div>
      ) : stories.data.items.length === 0 ? (
        <div className="mt-2"><EmptyState title="No published stories yet" body={p?.role === "editor" ? "Editors mostly make other people's stories better." : "Their first one is probably with an editor."} /></div>
      ) : (
        <>
          <div className="divide-y divide-line">{stories.data.items.map((s) => <StoryRow key={s._id} story={s} />)}</div>
          <Pager page={stories.data.page} pages={stories.data.pages} onPage={(n) => setParams({ page: String(n) })} />
        </>
      )}
    </Container>
  );
}
