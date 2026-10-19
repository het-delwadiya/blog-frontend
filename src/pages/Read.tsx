import { BookmarkSimple, LinkSimple, Trash } from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, useScroll, useSpring } from "motion/react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useLocation, useParams } from "react-router";
import { toast } from "sonner";
import { Byline, Cover, StoryCard } from "../components/StoryCard";
import { Avatar, Button, ButtonLink, Container, ErrorNote, Skeleton, TagLink, Textarea, cx } from "../components/ui";
import { useComments, useSave, useStory } from "../hooks";
import { api } from "../lib/api";
import { longDate, plural, timeAgo } from "../lib/format";
import type { Comment, Story, TocItem } from "../lib/types";
import { isEditor, useAuth } from "../store";
import NotFound from "./NotFound";

/** Highlights the section currently being read. */
function useActiveHeading(toc: TocItem[]) {
  const [active, setActive] = useState<string>();
  useEffect(() => {
    if (!toc.length) return;
    const els = toc.map((t) => document.getElementById(t.id)).filter((el): el is HTMLElement => !!el);
    // Any heading crossing the upper part of the screen re-picks the last one scrolled past.
    const io = new IntersectionObserver(() => {
      const passed = els.filter((el) => el.getBoundingClientRect().top < window.innerHeight * 0.35);
      setActive((passed.at(-1) ?? els[0]).id);
    }, { rootMargin: "0px 0px -65% 0px" });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [toc]);
  return active;
}

function Toc({ toc }: { toc: TocItem[] }) {
  const active = useActiveHeading(toc);
  if (toc.length < 2) return null;
  return (
    <nav aria-label="In this story" className="sticky top-28 hidden lg:block">
      <p className="mb-3 text-[13px] font-medium text-ink">In this story</p>
      <ol className="flex flex-col border-l border-line">
        {toc.map((t) => (
          <li key={t.id}>
            <a
              href={`#${t.id}`}
              className={cx(
                "-ml-px block border-l-2 py-1.5 text-[13px] leading-snug transition-colors",
                t.level === 3 ? "pl-7" : "pl-4",
                active === t.id ? "border-accent text-accent" : "border-transparent text-muted hover:text-ink",
              )}
            >
              {t.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function Actions({ story }: { story: Story }) {
  const user = useAuth((s) => s.user);
  const save = useSave(story);
  const share = async () => {
    const url = window.location.href.split("#")[0];
    if (navigator.share) return navigator.share({ title: story.title, url }).catch(() => {});
    await navigator.clipboard.writeText(url);
    toast.success("Link copied");
  };
  return (
    <div className="flex items-center gap-1">
      {user ? (
        <button
          type="button"
          onClick={() => save.mutate(!story.saved)}
          disabled={save.isPending}
          aria-pressed={story.saved}
          className={cx("inline-flex size-10 items-center justify-center rounded-full hover:bg-wash", story.saved ? "text-accent" : "text-ink-2")}
          aria-label={story.saved ? "Remove from reading list" : "Save to reading list"}
          title={story.saved ? "Saved" : "Save for later"}
        >
          <BookmarkSimple size={21} weight={story.saved ? "fill" : "regular"} />
        </button>
      ) : null}
      <button type="button" onClick={share} className="inline-flex size-10 items-center justify-center rounded-full text-ink-2 hover:bg-wash" aria-label="Share or copy link" title="Copy link">
        <LinkSimple size={21} />
      </button>
    </div>
  );
}

function Comments({ story }: { story: Story }) {
  const user = useAuth((s) => s.user);
  const { pathname } = useLocation();
  const { data, isPending } = useComments(story._id);
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const add = useMutation({
    mutationFn: () => api<Comment>(`/posts/${story._id}/comments`, { method: "POST", body: { body } }),
    onSuccess: (c) => {
      qc.setQueryData<Comment[]>(["comments", story._id], (old) => [...(old ?? []), c]);
      setBody("");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api(`/comments/${id}`, { method: "DELETE" }),
    onSuccess: (_r, id) => qc.setQueryData<Comment[]>(["comments", story._id], (old) => old?.filter((c) => c._id !== id)),
    onError: (e: Error) => toast.error(e.message),
  });
  const canDelete = (c: Comment) => !!user && (c.author._id === user._id || story.author._id === user._id || (isEditor(user) && !user.demo));
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (body.trim()) add.mutate();
  };

  return (
    <section aria-labelledby="responses" className="mt-16">
      <h2 id="responses" className="headline border-b border-ink pb-3 text-3xl">
        {data?.length ? plural(data.length, "response") : "Responses"}
      </h2>
      {user ? (
        <form onSubmit={submit} className="flex flex-col gap-3 border-b border-line py-6">
          <label htmlFor="reply" className="flex items-center gap-2.5 text-sm font-medium">
            <Avatar user={user} size={28} /> Respond as {user.name}
          </label>
          <Textarea id="reply" rows={3} maxLength={1500} value={body} onChange={(e) => setBody(e.target.value)} placeholder="What stayed with you?" className="font-serif text-lg" />
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-muted">{body.length > 1200 ? `${1500 - body.length} characters left` : ""}</span>
            <Button type="submit" size="sm" disabled={!body.trim() || add.isPending}>Respond</Button>
          </div>
        </form>
      ) : (
        <p className="border-b border-line py-6 text-ink-2">
          <Link to={`/login?next=${encodeURIComponent(pathname)}`} className="font-medium text-accent hover:underline">Sign in</Link> to respond.
        </p>
      )}
      {isPending ? (
        <Skeleton className="mt-6 h-20" />
      ) : (
        <ul className="divide-y divide-line">
          {data?.map((c) => (
            <li key={c._id} className="flex gap-4 py-6">
              <Avatar user={c.author} size={36} />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
                  <Link to={`/writers/${c.author.handle}`} className="font-medium hover:underline">{c.author.name}</Link>
                  {c.author._id === story.author._id && <span className="text-[12px] font-medium text-accent">Author</span>}
                  <time dateTime={c.createdAt} className="text-muted">{timeAgo(c.createdAt)}</time>
                </p>
                <p className="font-serif text-lg leading-relaxed whitespace-pre-line text-ink-2">{c.body}</p>
              </div>
              {canDelete(c) && (
                <button type="button" onClick={() => remove.mutate(c._id)} className="self-start rounded-full p-2 text-muted hover:bg-danger-soft hover:text-danger" aria-label="Delete response">
                  <Trash size={16} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Thin bar tracking progress through the article. Mounted with the article so the ref exists. */
function ReadingProgress({ target }: { target: React.RefObject<HTMLElement | null> }) {
  const { scrollYProgress } = useScroll({ target, offset: ["start start", "end end"] });
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 });
  return <motion.div aria-hidden className="fixed inset-x-0 top-0 z-40 h-[3px] origin-left bg-accent" style={{ scaleX }} />;
}

export default function Read() {
  const { slug } = useParams();
  const { data: story, error, isPending, refetch } = useStory(slug);
  const articleRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (story) document.title = `${story.title} · Folio`;
    return () => void (document.title = "Folio · Essays, edited.");
  }, [story]);

  if (error) return (error as { status?: number }).status === 404 ? <NotFound title="This story isn't published" body="It may have been withdrawn by its writer for another round of edits." /> : <Container className="py-16"><ErrorNote error={error} onRetry={() => refetch()} /></Container>;
  if (isPending)
    return (
      <Container className="flex max-w-[760px] flex-col gap-5 py-16">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="mt-6 aspect-[16/9] w-full" />
      </Container>
    );

  return (
    <>
      <article ref={articleRef}>
        <ReadingProgress target={articleRef} />
        <Container className="max-w-[860px] pt-12 sm:pt-16">
          {story.sandbox && <p className="mb-6 rounded-md bg-amber-soft px-4 py-3 text-sm text-amber">Written and approved by demo accounts. Only demo sessions can find this story, and it clears after a day.</p>}
          <div className="flex flex-wrap gap-x-4">{story.tags.map((t) => <TagLink key={t} tag={t} />)}</div>
          <h1 className="headline mt-4 text-[2.6rem] sm:text-6xl lg:text-[4.1rem]">{story.title}</h1>
          {story.dek && <p className="mt-5 max-w-[40ch] font-serif text-[1.45rem] leading-snug text-ink-2 italic sm:text-[1.6rem]">{story.dek}</p>}
          <div className="mt-8 flex items-center justify-between gap-4 border-y border-line py-4">
            <Byline story={story} size={40} showDate={false} />
            <Actions story={story} />
          </div>
        </Container>

        <Container className="mt-10 max-w-[1100px]">
          <div className="aspect-[16/9] overflow-hidden">
            <Cover story={story} eager sizes="(min-width: 1100px) 1100px, 100vw" />
          </div>
        </Container>

        <Container className="mt-12 grid gap-10 lg:grid-cols-[200px_minmax(0,680px)] lg:justify-center lg:gap-16">
          <aside><Toc toc={story.toc} /></aside>
          <div>
            <p className="mb-8 text-[13px] text-muted">
              Published {longDate(story.publishedAt)} · {story.minutes} min read
            </p>
            {/* Rendered and sanitized server-side on save; see folio-api src/lib/markdown.js */}
            <div className="prose-folio" dangerouslySetInnerHTML={{ __html: story.html }} />

            <div className="mt-12 flex flex-wrap items-center gap-2 border-t border-line pt-6">
              {story.tags.map((t) => (
                <Link key={t} to={`/topic/${t}`} className="rounded-full bg-wash px-3.5 py-1.5 text-[13px] text-ink-2 capitalize hover:bg-accent-soft hover:text-accent-2">
                  {t}
                </Link>
              ))}
            </div>

            <div className="mt-10 flex flex-col gap-4 bg-wash p-6 sm:flex-row sm:items-start sm:p-8">
              <Avatar user={story.author} size={64} />
              <div className="flex flex-col gap-2">
                <p className="text-[13px] text-muted">Written by</p>
                <Link to={`/writers/${story.author.handle}`} className="headline text-2xl hover:text-accent">{story.author.name}</Link>
                {story.author.bio && <p className="font-serif text-lg leading-snug text-ink-2">{story.author.bio}</p>}
              </div>
            </div>

            <Comments story={story} />
          </div>
        </Container>
      </article>

      {story.related.length > 0 && (
        <section aria-labelledby="next" className="mt-20 border-t border-ink">
          <Container className="pt-10">
            <div className="flex items-baseline justify-between">
              <h2 id="next" className="headline text-3xl">Read next</h2>
              <ButtonLink to="/stories" variant="ghost" size="sm">All stories</ButtonLink>
            </div>
            <div className="mt-8 grid gap-12 md:grid-cols-3 md:gap-8">
              {story.related.map((s) => <StoryCard key={s._id} story={s} />)}
            </div>
          </Container>
        </section>
      )}
    </>
  );
}
