import { Link } from "react-router";
import { Container, ErrorNote, Skeleton } from "../components/ui";
import { useTags } from "../hooks";
import { plural } from "../lib/format";

export default function Topics() {
  const { data, error, refetch } = useTags();
  return (
    <Container className="max-w-[880px] pt-12">
      <h1 className="headline text-5xl sm:text-6xl">Topics</h1>
      <p className="mt-4 max-w-[50ch] font-serif text-xl text-ink-2">Writers tag each story with up to five topics. Here is everything we have published, by subject.</p>
      {error ? (
        <div className="mt-8"><ErrorNote error={error} onRetry={() => refetch()} /></div>
      ) : (
        <ul className="mt-10 grid border-t border-ink sm:grid-cols-2 sm:gap-x-10">
          {data
            ? data.map((t) => (
                <li key={t.tag}>
                  <Link to={`/topic/${t.tag}`} className="group flex items-baseline justify-between border-b border-line py-5">
                    <span className="headline text-3xl capitalize group-hover:text-accent">{t.tag}</span>
                    <span className="text-sm text-muted">{plural(t.count, "story")}</span>
                  </Link>
                </li>
              ))
            : [0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="my-5 h-9" />)}
        </ul>
      )}
    </Container>
  );
}
