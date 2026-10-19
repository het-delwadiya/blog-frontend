import { ChatCircle } from "@phosphor-icons/react";
import { Link } from "react-router";
import { assetUrl } from "../lib/api";
import { shortDate } from "../lib/format";
import type { Card } from "../lib/types";
import { Avatar, Skeleton, TagLink, cx } from "./ui";

/** The story's photo, or a typeset stand-in when the writer hasn't added one. */
export function Cover({ story, className, sizes, eager }: { story: Pick<Card, "title" | "cover" | "coverAlt" | "tags">; className?: string; sizes?: string; eager?: boolean }) {
  if (story.cover)
    return (
      <img
        src={assetUrl(story.cover)}
        alt={story.coverAlt || ""}
        sizes={sizes}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : undefined}
        className={cx("h-full w-full bg-wash object-cover", className)}
      />
    );
  return (
    <div aria-hidden className={cx("relative flex h-full w-full items-end overflow-hidden bg-accent-soft p-[6%]", className)}>
      <span className="absolute -top-[18%] -right-[4%] font-serif text-[min(38vw,22rem)] leading-none font-semibold text-accent/12 italic select-none">
        {(story.title || "F").trim()[0]}
      </span>
      <span className="relative font-serif text-[13px] font-medium tracking-wide text-accent capitalize">{story.tags[0] ?? "Folio"}</span>
    </div>
  );
}

const href = (s: Card) => `/read/${s.slug}`;

export function Byline({ story, size = 28, showDate = true }: { story: Card; size?: number; showDate?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 text-[13px] text-muted">
      <Avatar user={story.author} size={size} />
      <span className="min-w-0">
        <Link to={`/writers/${story.author.handle}`} className="font-medium text-ink hover:underline">
          {story.author.name}
        </Link>
        <span className="block sm:inline sm:before:mx-1.5 sm:before:content-['·']">
          {showDate && story.publishedAt && <time dateTime={story.publishedAt}>{shortDate(story.publishedAt)}, </time>}
          {story.minutes} min read
        </span>
      </span>
    </div>
  );
}

export function LeadStory({ story }: { story: Card }) {
  return (
    <article className="group grid gap-6 md:grid-cols-12 md:gap-10">
      <Link to={href(story)} className="block aspect-[4/3] overflow-hidden md:col-span-7 md:aspect-[5/4] lg:aspect-[4/3]" tabIndex={-1} aria-hidden>
        <Cover story={story} eager sizes="(min-width: 768px) 58vw, 100vw" className="transition-transform duration-700 ease-out-soft group-hover:scale-[1.02]" />
      </Link>
      <div className="flex flex-col justify-center gap-5 md:col-span-5">
        <TagLink tag={story.tags[0]} />
        <h1 className="headline text-[2.5rem] sm:text-5xl lg:text-[3.6rem]">
          <Link to={href(story)} className="decoration-accent/40 decoration-2 underline-offset-[6px] group-hover:underline">
            {story.title}
          </Link>
        </h1>
        <p className="max-w-[46ch] font-serif text-xl leading-snug text-ink-2">{story.dek || story.excerpt}</p>
        <Byline story={story} size={36} />
      </div>
    </article>
  );
}

export function StoryCard({ story, large }: { story: Card; large?: boolean }) {
  return (
    <article className="group flex flex-col gap-4">
      <Link to={href(story)} className={cx("block overflow-hidden", large ? "aspect-[16/10]" : "aspect-[3/2]")} tabIndex={-1} aria-hidden>
        <Cover story={story} sizes="(min-width: 768px) 40vw, 100vw" className="transition-transform duration-700 ease-out-soft group-hover:scale-[1.03]" />
      </Link>
      <div className="flex flex-col gap-2.5">
        <TagLink tag={story.tags[0]} />
        <h2 className={cx("headline", large ? "text-[2rem] lg:text-[2.4rem]" : "text-[1.6rem]")}>
          <Link to={href(story)} className="decoration-accent/40 decoration-2 underline-offset-4 group-hover:underline">
            {story.title}
          </Link>
        </h2>
        <p className={cx("font-serif leading-snug text-ink-2", large ? "text-lg" : "line-clamp-3 text-[1.05rem]")}>{story.dek || story.excerpt}</p>
        <Byline story={story} />
      </div>
    </article>
  );
}

export function StoryRow({ story, rank }: { story: Card; rank?: number }) {
  return (
    <article className="group grid grid-cols-[1fr_auto] gap-5 py-6 sm:gap-8">
      <div className="flex min-w-0 gap-4">
        {rank !== undefined && <span className="headline w-7 shrink-0 text-3xl text-accent/40">{rank}</span>}
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex items-center gap-3">
            <TagLink tag={story.tags[0]} />
            {story.commentsCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[13px] text-muted" title={`${story.commentsCount} comments`}>
                <ChatCircle size={14} /> {story.commentsCount}
              </span>
            )}
          </div>
          <h3 className="headline text-[1.45rem] sm:text-[1.65rem]">
            <Link to={href(story)} className="decoration-accent/40 decoration-2 underline-offset-4 group-hover:underline">
              {story.title}
            </Link>
          </h3>
          <p className="line-clamp-2 max-w-[60ch] font-serif text-[1.05rem] leading-snug text-ink-2">{story.dek || story.excerpt}</p>
          <Byline story={story} size={24} />
        </div>
      </div>
      <Link to={href(story)} className="mt-1 block aspect-square w-24 overflow-hidden sm:aspect-[4/3] sm:w-44" tabIndex={-1} aria-hidden>
        <Cover story={story} sizes="176px" />
      </Link>
    </article>
  );
}

export function StoryRowSkeleton() {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-8 py-6">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-7 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
        <Skeleton className="h-6 w-40" />
      </div>
      <Skeleton className="aspect-[4/3] w-24 sm:w-44" />
    </div>
  );
}
