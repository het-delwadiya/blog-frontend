import { ArrowSquareOut, NotePencil, Plus, Trash } from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { Cover } from "../components/StoryCard";
import { EditorNote, openNote } from "../components/Timeline";
import { Button, Container, EmptyState, ErrorNote, Skeleton, StatusBadge, buttonClass } from "../components/ui";
import { useMyStories } from "../hooks";
import { api } from "../lib/api";
import { plural, timeAgo } from "../lib/format";
import type { Card, Draft, Status } from "../lib/types";
import { useAuth } from "../store";

const GROUPS: { title: string; statuses: Status[] }[] = [
  { title: "Needs your attention", statuses: ["changes", "rejected"] },
  { title: "Drafts", statuses: ["draft"] },
  { title: "With an editor", statuses: ["pending"] },
  { title: "Published", statuses: ["published"] },
];

export function useNewStory() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: () => api<Draft>("/posts", { method: "POST", body: { title: "", body: "" } }),
    onSuccess: (d) => navigate(`/write/${d._id}`),
    onError: (e: Error) => toast.error(e.message),
  });
}

function Row({ story }: { story: Card }) {
  const qc = useQueryClient();
  const note = openNote(story.history);
  const editable = ["draft", "changes", "rejected"].includes(story.status);
  const remove = useMutation({
    mutationFn: () => api(`/posts/${story._id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mine"] });
      toast.success("Story deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <li className="grid gap-5 py-6 sm:grid-cols-[120px_1fr]">
      <Link to={story.status === "published" ? `/read/${story.slug}` : `/write/${story._id}`} className="hidden aspect-[4/3] overflow-hidden sm:block" tabIndex={-1} aria-hidden>
        <Cover story={story} sizes="120px" />
      </Link>
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px] text-muted">
          <StatusBadge status={story.status} />
          <span>Edited {timeAgo(story.updatedAt)}</span>
          <span>{plural(story.words ?? 0, "word")}</span>
        </div>
        <h3 className="headline text-2xl">{story.title || <span className="text-muted italic">Untitled story</span>}</h3>
        {note?.note && <EditorNote entry={note} />}
        <div className="flex flex-wrap gap-2 pt-1">
          {editable && (
            <Link to={`/write/${story._id}`} className={buttonClass(note ? "primary" : "secondary", "sm")}>
              <NotePencil size={15} /> {note ? "Revise" : "Edit"}
            </Link>
          )}
          {story.status === "pending" && (
            <Link to={`/write/${story._id}`} className={buttonClass("secondary", "sm")}>
              View
            </Link>
          )}
          {story.status === "published" && (
            <Link to={`/read/${story.slug}`} className={buttonClass("secondary", "sm")}>
              <ArrowSquareOut size={15} /> Read it live
            </Link>
          )}
          {story.status !== "published" && (
            <Button
              size="sm"
              variant="ghost"
              disabled={remove.isPending}
              onClick={() => confirm(`Delete “${story.title || "Untitled story"}”? This can't be undone.`) && remove.mutate()}
              className="text-muted hover:text-danger"
            >
              <Trash size={15} /> Delete
            </Button>
          )}
        </div>
      </div>
    </li>
  );
}

export default function Desk() {
  const user = useAuth((s) => s.user)!;
  const { data, isPending, error, refetch } = useMyStories();
  const create = useNewStory();
  const counts = Object.fromEntries(GROUPS.map((g) => [g.title, data?.filter((s) => g.statuses.includes(s.status)) ?? []]));

  return (
    <Container className="max-w-[920px] pt-12">
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-ink pb-6">
        <div>
          <p className="text-[13px] text-muted">{user.demo ? "Demo writer's desk" : `${user.name}'s desk`}</p>
          <h1 className="headline mt-1 text-5xl sm:text-6xl">Your stories</h1>
        </div>
        <Button size="lg" onClick={() => create.mutate()} disabled={create.isPending}>
          <Plus size={18} /> New story
        </Button>
      </div>

      {error ? (
        <div className="mt-8"><ErrorNote error={error} onRetry={() => refetch()} /></div>
      ) : isPending ? (
        <div className="mt-8 flex flex-col gap-6">{[0, 1].map((i) => <Skeleton key={i} className="h-32" />)}</div>
      ) : data.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="A blank page" body="Start a story in Markdown with a live preview. When it's ready, send it to an editor." action={<Button onClick={() => create.mutate()}>Start writing</Button>} />
        </div>
      ) : (
        GROUPS.filter((g) => counts[g.title].length).map((g) => (
          <section key={g.title} className="mt-12" aria-labelledby={g.title}>
            <h2 id={g.title} className="flex items-baseline gap-3 text-sm font-medium text-ink">
              {g.title} <span className="text-muted">{counts[g.title].length}</span>
            </h2>
            <ul className="mt-2 divide-y divide-line border-t border-line">{counts[g.title].map((s) => <Row key={s._id} story={s} />)}</ul>
          </section>
        ))
      )}
    </Container>
  );
}
