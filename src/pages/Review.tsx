import { ArrowRight, ArrowsClockwise } from "@phosphor-icons/react";
import { Link } from "react-router";
import { Byline, Cover } from "../components/StoryCard";
import { Container, EmptyState, ErrorNote, Skeleton, StatusBadge } from "../components/ui";
import { useReviewQueue } from "../hooks";
import { plural, timeAgo } from "../lib/format";
import type { Card, HistoryEntry } from "../lib/types";
import { useAuth } from "../store";

const lastDecision = (h: HistoryEntry[] = []) => [...h].reverse().find((e) => ["approved", "changes", "rejected"].includes(e.action));
const isResubmission = (h: HistoryEntry[] = []) => h.filter((e) => e.action === "submitted").length > 1;

function QueueItem({ story }: { story: Card }) {
  const resubmitted = isResubmission(story.history);
  return (
    <li>
      <Link to={`/review/${story._id}`} className="group grid gap-5 py-7 sm:grid-cols-[200px_1fr_auto] sm:items-center sm:gap-8">
        <div className="aspect-[3/2] overflow-hidden">
          <Cover story={story} sizes="200px" />
        </div>
        <div className="flex min-w-0 flex-col gap-2.5">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted">
            {resubmitted && (
              <span className="inline-flex items-center gap-1 font-medium text-amber">
                <ArrowsClockwise size={14} /> Revised after notes
              </span>
            )}
            <span>Submitted {timeAgo(story.submittedAt!)}</span>
            <span>{plural(story.words ?? 0, "word")}</span>
          </p>
          <h3 className="headline text-[1.75rem] group-hover:text-accent">{story.title}</h3>
          <p className="line-clamp-2 max-w-[60ch] font-serif text-lg leading-snug text-ink-2">{story.dek || story.excerpt}</p>
          <Byline story={story} size={24} showDate={false} />
        </div>
        <span className="hidden items-center gap-1.5 text-sm font-medium text-accent sm:inline-flex">
          Review <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </Link>
    </li>
  );
}

export default function Review() {
  const user = useAuth((s) => s.user)!;
  const { data, isPending, error, refetch } = useReviewQueue();
  return (
    <Container className="max-w-[1000px] pt-12">
      <div className="border-b border-ink pb-6">
        <p className="text-[13px] text-muted">{user.demo ? "Demo editor's desk" : "Editor's desk"}</p>
        <h1 className="headline mt-1 text-5xl sm:text-6xl">Review queue</h1>
        <p className="mt-4 max-w-[56ch] font-serif text-xl text-ink-2">
          {data ? (data.pending.length ? `${plural(data.pending.length, "story")} waiting, oldest first.` : "All caught up.") : "Loading the queue."}
          {user.demo && " Sample stories return to the queue a couple of hours after you review them."}
        </p>
      </div>

      {error ? (
        <div className="mt-8"><ErrorNote error={error} onRetry={() => refetch()} /></div>
      ) : isPending ? (
        <div className="mt-6 flex flex-col gap-6">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-36" />)}</div>
      ) : (
        <>
          {data.pending.length === 0 ? (
            <div className="mt-6"><EmptyState title="The queue is empty" body="New submissions from writers will show up here." /></div>
          ) : (
            <ul className="divide-y divide-line">{data.pending.map((s) => <QueueItem key={s._id} story={s} />)}</ul>
          )}

          {data.recent.length > 0 && (
            <section className="mt-16" aria-labelledby="recent">
              <h2 id="recent" className="headline border-b border-ink pb-3 text-3xl">Recently decided</h2>
              <ul className="divide-y divide-line">
                {data.recent.map((s) => {
                  const d = lastDecision(s.history);
                  return (
                    <li key={s._id} className="flex flex-col gap-2 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                      <div className="min-w-0">
                        {s.status === "published" ? (
                          <Link to={`/read/${s.slug}`} className="headline text-xl hover:text-accent">{s.title}</Link>
                        ) : (
                          <span className="headline text-xl">{s.title}</span>
                        )}
                        <p className="mt-1 text-[13px] text-muted">
                          {s.author.name}
                          {d && typeof d.by === "object" && `, decided by ${d.by.name} ${timeAgo(d.at)}`}
                        </p>
                      </div>
                      <StatusBadge status={s.status} className="self-start sm:self-auto" />
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </>
      )}
    </Container>
  );
}
