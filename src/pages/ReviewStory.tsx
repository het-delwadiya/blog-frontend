import { ArrowLeft, Check, PencilLine, X } from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { diffWords } from "diff";
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { Byline, Cover } from "../components/StoryCard";
import { Timeline } from "../components/Timeline";
import { Button, Container, ErrorNote, Field, Skeleton, StatusBadge, Textarea, cx } from "../components/ui";
import { useDraft } from "../hooks";
import { api } from "../lib/api";
import { plural } from "../lib/format";
import { renderMarkdown } from "../lib/markdown";
import type { Draft } from "../lib/types";
import { useAuth } from "../store";
import NotFound from "./NotFound";

type Decision = "approve" | "changes" | "reject";

/** Word-level diff of the Markdown since the editor's last decision. */
function Changes({ before, after }: { before: string; after: string }) {
  const parts = useMemo(() => diffWords(before, after), [before, after]);
  const added = parts.filter((p) => p.added).reduce((n, p) => n + p.value.split(/\s+/).filter(Boolean).length, 0);
  const removed = parts.filter((p) => p.removed).reduce((n, p) => n + p.value.split(/\s+/).filter(Boolean).length, 0);
  return (
    <div>
      <p className="mb-6 flex flex-wrap gap-x-5 text-[13px]">
        {added > 0 && <span className="font-medium text-accent">+{plural(added, "word")} added</span>}
        {removed > 0 && <span className="font-medium text-danger">-{plural(removed, "word")} removed</span>}
        {!added && !removed && <span className="text-muted">Only formatting changed</span>}
      </p>
      <div className="font-serif text-[1.15rem] leading-[1.75] whitespace-pre-wrap text-ink-2">
        {parts.map((p, i) =>
          p.added ? (
            <ins key={i} className="bg-accent-soft text-accent-2 no-underline decoration-accent/40 [text-decoration-line:underline]">{p.value}</ins>
          ) : p.removed ? (
            <del key={i} className="bg-danger-soft text-danger/80">{p.value}</del>
          ) : (
            <span key={i}>{p.value}</span>
          ),
        )}
      </div>
    </div>
  );
}

function DecisionPanel({ story }: { story: Draft }) {
  const user = useAuth((s) => s.user)!;
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [decision, setDecision] = useState<Decision>("approve");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const own = story.author._id === user._id;
  const send = useMutation({
    mutationFn: () => api<{ status: string; slug?: string }>(`/posts/${story._id}/review`, { method: "POST", body: { decision, note } }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["review"] });
      qc.invalidateQueries({ queryKey: ["review-count"] });
      qc.invalidateQueries({ queryKey: ["stories"] });
      if (r.status === "published") toast.success(story.sandbox ? "Published. Demo sessions can see it on the front page." : "Published. It's live on the front page.", { action: { label: "Read it", onClick: () => navigate(`/read/${r.slug}`) } });
      else toast.success(decision === "changes" ? "Sent back to the writer with your notes" : "Declined, with your note to the writer");
      navigate("/review");
    },
    onError: (e: Error) => setError(e.message),
  });

  if (story.status !== "pending")
    return (
      <div className="flex flex-col gap-3 bg-wash p-6">
        <StatusBadge status={story.status} className="self-start" />
        <p className="text-sm text-ink-2">This story isn't waiting for review anymore.</p>
      </div>
    );
  if (own) return <p className="bg-wash p-6 text-sm text-ink-2">This is your own story. Another editor has to review it.</p>;

  const options: [Decision, string, typeof Check][] = [
    ["approve", "Approve and publish", Check],
    ["changes", "Request changes", PencilLine],
    ["reject", "Decline", X],
  ];
  return (
    <form
      className="flex flex-col gap-5 border border-ink p-6"
      onSubmit={(e) => {
        e.preventDefault();
        setError("");
        if (decision !== "approve" && note.trim().length < 10) return setError("Tell the writer why in a sentence or two");
        send.mutate();
      }}
    >
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-3 text-sm font-medium">Your decision</legend>
        {options.map(([value, label, Icon]) => (
          <label
            key={value}
            className={cx(
              "flex cursor-pointer items-center gap-3 rounded-md border px-4 py-3 text-[15px] transition-colors",
              decision === value ? (value === "approve" ? "border-accent bg-accent-soft text-accent-2" : value === "changes" ? "border-amber bg-amber-soft text-amber" : "border-danger bg-danger-soft text-danger") : "border-line hover:border-ink/40",
            )}
          >
            <input type="radio" name="decision" value={value} checked={decision === value} onChange={() => setDecision(value)} className="sr-only" />
            <Icon size={18} />
            {label}
          </label>
        ))}
      </fieldset>
      <Field label={decision === "approve" ? "Note to the writer (optional)" : "Note to the writer"} error={error || undefined}>
        {(id, d) => (
          <Textarea
            id={id}
            aria-describedby={d}
            aria-invalid={!!error}
            rows={5}
            maxLength={2000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={decision === "approve" ? "A line of thanks goes a long way" : decision === "changes" ? "What would make this ready? Be specific." : "Why isn't this right for Folio?"}
            className="font-serif text-[17px]"
          />
        )}
      </Field>
      <Button type="submit" size="lg" disabled={send.isPending} variant={decision === "reject" ? "danger" : "primary"}>
        {send.isPending ? "Sending" : decision === "approve" ? "Publish story" : decision === "changes" ? "Send back with notes" : "Decline story"}
      </Button>
    </form>
  );
}

export default function ReviewStory() {
  const { id } = useParams();
  const { data: story, error, isPending, refetch } = useDraft(id);
  const html = useMemo(() => (story ? renderMarkdown(story.body).html : ""), [story]);
  const changed = !!story?.reviewedBody && story.reviewedBody !== story.body;
  const [tab, setTab] = useState<"story" | "changes">("story");

  if (error) return (error as { status?: number }).status === 404 ? <NotFound title="That submission is gone" body="The writer may have withdrawn or deleted it." /> : <Container className="py-16"><ErrorNote error={error} onRetry={() => refetch()} /></Container>;
  if (isPending)
    return (
      <Container className="flex max-w-[760px] flex-col gap-5 py-16">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-80 w-full" />
      </Container>
    );

  return (
    <Container className="grid gap-12 pt-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-16">
      <div className="min-w-0">
        <Link to="/review" className="inline-flex items-center gap-1.5 text-sm text-ink-2 hover:text-ink">
          <ArrowLeft size={16} /> Review queue
        </Link>
        <article className="mx-auto mt-8 max-w-[700px]">
          <div className="flex flex-wrap gap-x-4 text-[13px] text-accent capitalize">{story.tags.join("  ")}</div>
          <h1 className="headline mt-3 text-[2.6rem] sm:text-5xl">{story.title}</h1>
          {story.dek && <p className="mt-4 font-serif text-[1.4rem] leading-snug text-ink-2 italic">{story.dek}</p>}
          <div className="mt-6 border-y border-line py-4">
            <Byline story={story} size={36} showDate={false} />
          </div>

          {changed && (
            <div role="tablist" aria-label="Show" className="mt-8 inline-flex rounded-full bg-wash p-1 text-sm">
              {(
                [
                  ["story", "Full story"],
                  ["changes", "Changes since your last review"],
                ] as const
              ).map(([v, label]) => (
                <button key={v} role="tab" aria-selected={tab === v} onClick={() => setTab(v)} className={cx("rounded-full px-4 py-1.5 transition-colors", tab === v ? "bg-paper text-ink shadow-sm" : "text-muted hover:text-ink")}>
                  {label}
                </button>
              ))}
            </div>
          )}

          <div className="mt-8">
            {tab === "changes" && changed ? (
              <Changes before={story.reviewedBody!} after={story.body} />
            ) : (
              <>
                <div className="aspect-[16/9] overflow-hidden">
                  <Cover story={story} />
                </div>
                <div className="prose-folio mt-10" dangerouslySetInnerHTML={{ __html: html }} />
              </>
            )}
          </div>
        </article>
      </div>

      <aside className="flex flex-col gap-10 lg:sticky lg:top-24 lg:self-start lg:pt-14">
        <DecisionPanel story={story} />
        <div>
          <h2 className="mb-4 text-sm font-medium">History</h2>
          <Timeline history={story.history} />
        </div>
      </aside>
    </Container>
  );
}
