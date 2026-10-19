import { ArrowRight } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import { Link } from "react-router";
import { LeadStory, StoryCard, StoryRow, StoryRowSkeleton } from "../components/StoryCard";
import { Button, Container, ErrorNote, Skeleton, StatusBadge } from "../components/ui";
import { useDemoLogin, useStories, useTags } from "../hooks";
import { longDate } from "../lib/format";
import { useAuth } from "../store";

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div initial={reduce ? false : { opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}>
      {children}
    </motion.div>
  );
}

/** The editorial loop, drawn with the same status badges writers and editors see. */
function HowItWorks() {
  const user = useAuth((s) => s.user);
  const demo = useDemoLogin();
  return (
    <section className="bg-wash">
      <Container className="grid gap-12 py-16 md:grid-cols-12 md:py-20">
        <div className="flex flex-col gap-5 md:col-span-5">
          <h2 className="headline text-4xl sm:text-[2.75rem]">Nothing here went live without an editor.</h2>
          <p className="max-w-[44ch] font-serif text-xl leading-snug text-ink-2">Writers draft in Markdown and submit. Editors approve, send it back with notes, or decline. Try either side of the desk.</p>
          {!user && (
            <div className="flex flex-wrap gap-3 pt-2">
              <Button onClick={() => demo.mutate("writer")} disabled={demo.isPending}>Write as a demo writer</Button>
              <Button variant="secondary" onClick={() => demo.mutate("editor")} disabled={demo.isPending}>Edit as a demo editor</Button>
            </div>
          )}
        </div>
        <ol className="grid gap-px self-center overflow-hidden border border-line bg-line sm:grid-cols-2 md:col-span-7">
          {(
            [
              ["draft", "The writer drafts with a live preview. Autosaves as they go."],
              ["pending", "Submitted stories wait in the editor's queue, oldest first."],
              ["changes", "Sent back with a note. On resubmit the editor sees exactly what changed."],
              ["published", "Approved stories get a permanent link, an RSS entry and comments."],
            ] as const
          ).map(([status, text], i) => (
            <li key={status} className="flex flex-col gap-3 bg-paper p-6">
              <span className="flex items-center justify-between">
                <StatusBadge status={status} />
                <span className="font-serif text-2xl text-accent/35 italic">{i + 1}</span>
              </span>
              <p className="text-[15px] leading-relaxed text-ink-2">{text}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

function TopicsList() {
  const { data } = useTags();
  if (!data) return <Skeleton className="h-40 w-full" />;
  return (
    <ul className="flex flex-col">
      {data.map((t) => (
        <li key={t.tag}>
          <Link to={`/topic/${t.tag}`} className="group flex items-baseline justify-between border-b border-line py-3 font-serif text-xl capitalize hover:text-accent">
            {t.tag}
            <span className="font-sans text-[13px] text-muted group-hover:text-accent">{t.count}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function Home() {
  const { data, isPending, error, refetch } = useStories({ limit: 12 });
  const [lead, a, b, ...rest] = data?.items ?? [];

  return (
    <>
      <Container className="pt-8 pb-14 md:pt-10">
        <p className="mb-7 border-b border-ink pb-3 text-[13px] text-muted">{longDate(new Date().toISOString())}</p>
        {error ? (
          <ErrorNote error={error} onRetry={() => refetch()} />
        ) : isPending ? (
          <div className="grid gap-10 md:grid-cols-12">
            <Skeleton className="aspect-[4/3] md:col-span-7" />
            <div className="flex flex-col justify-center gap-4 md:col-span-5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-2/3" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        ) : lead ? (
          <LeadStory story={lead} />
        ) : null}
      </Container>

      {a && (
        <Container className="pb-20">
          <div className="grid gap-12 border-t border-line pt-12 md:grid-cols-12 md:gap-10">
          <div className="md:col-span-7">
            <Reveal>
              <StoryCard story={a} large />
            </Reveal>
          </div>
          {b && (
            <div className="md:col-span-5 md:border-l md:border-line md:pl-10">
              <Reveal delay={0.08}>
                <StoryCard story={b} />
              </Reveal>
            </div>
          )}
          </div>
        </Container>
      )}

      <HowItWorks />

      <Container className="grid gap-14 pt-16 md:grid-cols-12 md:gap-10 md:pt-20">
        <section className="md:col-span-8" aria-labelledby="latest">
          <h2 id="latest" className="headline border-b border-ink pb-3 text-3xl">More stories</h2>
          <div className="divide-y divide-line">
            {isPending ? [0, 1, 2].map((i) => <StoryRowSkeleton key={i} />) : rest.map((s) => <StoryRow key={s._id} story={s} />)}
          </div>
          {data && data.total > 12 && (
            <Link to="/stories?page=2" className="mt-4 inline-flex items-center gap-2 text-[15px] font-medium text-accent hover:underline">
              Older stories <ArrowRight size={16} />
            </Link>
          )}
        </section>
        <aside className="md:col-span-4" aria-labelledby="topics">
          <div className="md:sticky md:top-24">
            <h2 id="topics" className="headline border-b border-ink pb-3 text-3xl">Topics</h2>
            <TopicsList />
          </div>
        </aside>
      </Container>
    </>
  );
}
