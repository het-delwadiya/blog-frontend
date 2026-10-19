import { StoryRow, StoryRowSkeleton } from "../components/StoryCard";
import { ButtonLink, Container, EmptyState, ErrorNote } from "../components/ui";
import { useSaved } from "../hooks";
import { plural } from "../lib/format";

export default function Saved() {
  const { data, isPending, error, refetch } = useSaved();
  return (
    <Container className="max-w-[880px] pt-12">
      <h1 className="headline text-5xl sm:text-6xl">Reading list</h1>
      {data && data.length > 0 && <p className="mt-6 border-b border-ink pb-3 text-sm text-muted">{plural(data.length, "story")} saved for later, newest first</p>}
      {error ? (
        <div className="mt-8"><ErrorNote error={error} onRetry={() => refetch()} /></div>
      ) : isPending ? (
        <div className="divide-y divide-line">{[0, 1].map((i) => <StoryRowSkeleton key={i} />)}</div>
      ) : data.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="Nothing saved yet" body="Tap the bookmark on any story to keep it here for later." action={<ButtonLink to="/stories" variant="secondary">Browse stories</ButtonLink>} />
        </div>
      ) : (
        <div className="divide-y divide-line">{data.map((s) => <StoryRow key={s._id} story={s} />)}</div>
      )}
    </Container>
  );
}
