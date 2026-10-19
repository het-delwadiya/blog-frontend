import { ButtonLink, Container } from "../components/ui";

export default function NotFound({ title = "This page isn't in the issue", body = "The link may be old, or the story was withdrawn by its writer." }: { title?: string; body?: string }) {
  return (
    <Container className="flex flex-col items-start gap-5 py-24">
      <p className="font-serif text-7xl text-accent/30 italic">404</p>
      <h1 className="headline text-4xl sm:text-5xl">{title}</h1>
      <p className="max-w-[48ch] font-serif text-xl text-ink-2">{body}</p>
      <ButtonLink to="/">Back to today's stories</ButtonLink>
    </Container>
  );
}
