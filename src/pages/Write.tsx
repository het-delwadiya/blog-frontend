import {
  ArrowLeft,
  Code,
  Image as ImageIcon,
  LinkSimple,
  ListBullets,
  ListNumbers,
  PaperPlaneTilt,
  Quotes,
  TextB,
  TextHThree,
  TextHTwo,
  TextItalic,
  X,
} from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDeferredValue, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { Cover } from "../components/StoryCard";
import { EditorNote, Timeline, openNote } from "../components/Timeline";
import { Button, Container, ErrorNote, Input, Skeleton, StatusBadge, cx } from "../components/ui";
import { useDraft } from "../hooks";
import { api, assetUrl, uploadImage } from "../lib/api";
import { plural, timeAgo } from "../lib/format";
import { countWords, renderMarkdown } from "../lib/markdown";
import type { Draft } from "../lib/types";
import NotFound from "./NotFound";

type Form = Pick<Draft, "title" | "dek" | "body" | "tags" | "cover" | "coverAlt">;
type View = "write" | "split" | "preview";

const EDITABLE = ["draft", "changes", "rejected"];

/** Wraps or prefixes the textarea selection, keeping the cursor where a writer expects it. */
function applyFormat(el: HTMLTextAreaElement, kind: string): { value: string; start: number; end: number } {
  const { value, selectionStart: s, selectionEnd: e } = el;
  const sel = value.slice(s, e);
  const wrap = (before: string, after = before, placeholder = "text") => {
    const inner = sel || placeholder;
    return { value: value.slice(0, s) + before + inner + after + value.slice(e), start: s + before.length, end: s + before.length + inner.length };
  };
  const linePrefix = (prefix: (i: number) => string) => {
    const lineStart = value.lastIndexOf("\n", s - 1) + 1;
    const block = value.slice(lineStart, e) || "";
    const lines = block.split("\n").map((l, i) => prefix(i) + l.replace(/^(#{1,4} |> |- |\d+\. )/, ""));
    const next = lines.join("\n");
    return { value: value.slice(0, lineStart) + next + value.slice(e), start: lineStart, end: lineStart + next.length };
  };
  switch (kind) {
    case "bold": return wrap("**");
    case "italic": return wrap("*");
    case "code": return sel.includes("\n") ? wrap("```\n", "\n```", "code") : wrap("`", "`", "code");
    case "link": return wrap("[", "](https://)", "link text");
    case "h2": return linePrefix(() => "## ");
    case "h3": return linePrefix(() => "### ");
    case "quote": return linePrefix(() => "> ");
    case "ul": return linePrefix(() => "- ");
    case "ol": return linePrefix((i) => `${i + 1}. `);
    default: return { value, start: s, end: e };
  }
}

function TagsInput({ tags, onChange, disabled }: { tags: string[]; onChange: (t: string[]) => void; disabled?: boolean }) {
  const [text, setText] = useState("");
  const add = () => {
    const t = text.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 24);
    if (t.length >= 2 && !tags.includes(t) && tags.length < 5) onChange([...tags, t]);
    setText("");
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      {tags.map((t) => (
        <span key={t} className="inline-flex h-8 items-center gap-1 rounded-full bg-accent-soft pr-1.5 pl-3 text-[13px] font-medium text-accent-2 capitalize">
          {t}
          {!disabled && (
            <button type="button" onClick={() => onChange(tags.filter((x) => x !== t))} className="rounded-full p-1 hover:bg-accent/10" aria-label={`Remove ${t}`}>
              <X size={12} />
            </button>
          )}
        </span>
      ))}
      {!disabled && tags.length < 5 && (
        <input
          aria-label="Add a topic"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add();
            } else if (e.key === "Backspace" && !text && tags.length) onChange(tags.slice(0, -1));
          }}
          onBlur={add}
          placeholder={tags.length ? "Add another" : "Add topics, like food or design"}
          className="h-8 min-w-40 flex-1 bg-transparent text-sm placeholder:text-muted focus:outline-none"
        />
      )}
    </div>
  );
}

function CoverPicker({ form, set, disabled }: { form: Form; set: (p: Partial<Form>) => void; disabled?: boolean }) {
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const pick = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      const { url } = await uploadImage(file, "cover");
      set({ cover: url });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  if (form.cover)
    return (
      <div className="flex items-start gap-4">
        <img src={assetUrl(form.cover)} alt="" className="aspect-[16/10] w-32 shrink-0 object-cover sm:w-40" />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Input aria-label="Describe the cover photo" disabled={disabled} value={form.coverAlt ?? ""} maxLength={200} onChange={(e) => set({ coverAlt: e.target.value })} placeholder="Describe the photo for screen readers" className="h-9 text-sm" />
          {!disabled && (
            <button type="button" onClick={() => set({ cover: "", coverAlt: "" })} className="inline-flex items-center gap-1.5 self-start text-[13px] text-muted hover:text-danger">
              <X size={13} /> Remove cover
            </button>
          )}
        </div>
      </div>
    );
  if (disabled) return null;
  return (
    <button
      type="button"
      onClick={() => input.current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        pick(e.dataTransfer.files[0]);
      }}
      disabled={busy}
      className="group flex w-full items-center gap-4 border border-dashed border-ink/25 px-5 py-4 text-left transition-colors hover:border-accent hover:bg-accent-soft/40"
    >
      <ImageIcon size={24} className="text-accent" />
      <span className="flex flex-col">
        <span className="text-sm font-medium">{busy ? "Uploading" : "Add a cover photo"}</span>
        <span className="text-[13px] text-muted">Drop an image or click to choose. Wide photos work best.</span>
      </span>
      <input ref={input} type="file" accept="image/png,image/jpeg,image/webp,image/avif,image/gif" hidden onChange={(e) => pick(e.target.files?.[0])} />
    </button>
  );
}

function Preview({ form }: { form: Form }) {
  const body = useDeferredValue(form.body);
  const { html } = useMemo(() => renderMarkdown(body), [body]);
  return (
    <article className="mx-auto max-w-[680px] py-10">
      <h1 className="headline text-[2.6rem] sm:text-5xl">{form.title || <span className="text-muted/60">Untitled story</span>}</h1>
      {form.dek && <p className="mt-4 font-serif text-[1.4rem] leading-snug text-ink-2 italic">{form.dek}</p>}
      <div className="mt-8 aspect-[16/9] overflow-hidden">
        <Cover story={{ title: form.title, cover: form.cover, coverAlt: form.coverAlt, tags: form.tags }} />
      </div>
      {body.trim() ? <div className="prose-folio mt-10" dangerouslySetInnerHTML={{ __html: html }} /> : <p className="mt-10 font-serif text-xl text-muted italic">Your story will appear here as you write.</p>}
    </article>
  );
}

function Editor({ draft }: { draft: Draft }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [form, setForm] = useState<Form>({ title: draft.title, dek: draft.dek, body: draft.body, tags: draft.tags, cover: draft.cover ?? "", coverAlt: draft.coverAlt ?? "" });
  const [status, setStatus] = useState(draft.status);
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState(draft.updatedAt);
  const [view, setView] = useState<View>("split");
  const [, tick] = useState(0);
  const area = useRef<HTMLTextAreaElement>(null);
  const editable = EDITABLE.includes(status);
  const note = openNote(draft.history);
  const { words, minutes } = countWords(form.body);

  const set = (patch: Partial<Form>) => {
    setForm((f) => ({ ...f, ...patch }));
    setDirty(true);
  };

  const save = useMutation({
    mutationFn: (f: Form) => api<Draft>(`/posts/${draft._id}`, { method: "PATCH", body: f }),
    onSuccess: (d) => {
      setStatus(d.status);
      setSavedAt(d.updatedAt);
      qc.invalidateQueries({ queryKey: ["mine"] });
    },
    onError: (e: Error) => {
      setDirty(true);
      toast.error(`Couldn't save: ${e.message}`);
    },
  });

  // Autosave a moment after the writer pauses.
  useEffect(() => {
    if (!dirty || !editable) return;
    const t = setTimeout(() => {
      setDirty(false);
      save.mutate(form);
    }, 1200);
    return () => clearTimeout(t);
  }, [form, dirty, editable]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty || save.isPending) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, save.isPending]);

  // Keeps "saved 1 minute ago" fresh.
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  const transition = useMutation({
    mutationFn: async (action: "submit" | "withdraw") => {
      if (action === "submit" && (dirty || save.isPending)) {
        setDirty(false);
        await api(`/posts/${draft._id}`, { method: "PATCH", body: form });
      }
      return api<Draft>(`/posts/${draft._id}/${action}`, { method: "POST" });
    },
    onSuccess: (d, action) => {
      qc.invalidateQueries({ queryKey: ["mine"] });
      qc.invalidateQueries({ queryKey: ["draft", draft._id] });
      if (action === "submit") {
        toast.success("Sent to the editors. We'll keep it safe in your desk.");
        navigate("/desk");
      } else {
        setStatus(d.status);
        toast.success("Withdrawn. It's a draft again, so you can keep editing.");
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const format = (kind: string) => {
    const el = area.current;
    if (!el || !editable) return;
    const r = applyFormat(el, kind);
    set({ body: r.value });
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(r.start, r.end);
    });
  };

  const insertImage = async (file?: File) => {
    const el = area.current;
    if (!file || !el) return;
    const t = toast.loading("Uploading image");
    try {
      const { url } = await uploadImage(file, "inline");
      const at = el.selectionEnd;
      const md = `\n\n![${file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ")}](${assetUrl(url)})\n\n`;
      set({ body: el.value.slice(0, at) + md + el.value.slice(at) });
      toast.success("Image added", { id: t });
    } catch (e) {
      toast.error((e as Error).message, { id: t });
    }
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!(e.metaKey || e.ctrlKey)) return;
    const k = { b: "bold", i: "italic", k: "link" }[e.key.toLowerCase()];
    if (k) {
      e.preventDefault();
      format(k);
    }
  };

  const imageInput = useRef<HTMLInputElement>(null);
  const tools: [string, typeof TextB, string, string?][] = [
    ["bold", TextB, "Bold", "Ctrl+B"],
    ["italic", TextItalic, "Italic", "Ctrl+I"],
    ["h2", TextHTwo, "Section heading"],
    ["h3", TextHThree, "Subheading"],
    ["link", LinkSimple, "Link", "Ctrl+K"],
    ["quote", Quotes, "Quote"],
    ["ul", ListBullets, "Bulleted list"],
    ["ol", ListNumbers, "Numbered list"],
    ["code", Code, "Code"],
  ];

  const saveLabel = !editable ? "" : save.isPending ? "Saving" : dirty ? "Unsaved changes" : `Saved ${timeAgo(savedAt)}`;

  return (
    <div className="flex min-h-[calc(100dvh-7rem)] flex-col">
      <div className="sticky top-16 z-20 border-b border-line bg-paper/95 backdrop-blur">
        <Container className="flex h-14 max-w-none items-center gap-3 sm:gap-4">
          <Link to="/desk" className="inline-flex items-center gap-1.5 text-sm text-ink-2 hover:text-ink" aria-label="Back to your stories">
            <ArrowLeft size={16} /> <span className="hidden sm:inline">Your stories</span>
          </Link>
          <StatusBadge status={status} />
          <span className="hidden text-[13px] text-muted sm:inline" aria-live="polite">{saveLabel}</span>
          <div role="tablist" aria-label="Editor view" className="ml-auto inline-flex rounded-full bg-wash p-1 text-[13px]">
            {(["write", "split", "preview"] as View[]).map((v) => (
              <button
                key={v}
                role="tab"
                aria-selected={view === v}
                onClick={() => setView(v)}
                className={cx("rounded-full px-3 py-1 capitalize transition-colors", v === "split" && "hidden lg:block", view === v ? "bg-paper text-ink shadow-sm" : "text-muted hover:text-ink")}
              >
                {v}
              </button>
            ))}
          </div>
          {editable ? (
            <Button size="sm" onClick={() => transition.mutate("submit")} disabled={transition.isPending}>
              <PaperPlaneTilt size={15} /> <span className="hidden sm:inline">{status === "changes" ? "Resubmit" : "Submit for review"}</span><span className="sm:hidden">Submit</span>
            </Button>
          ) : (
            <Button size="sm" variant="secondary" onClick={() => transition.mutate("withdraw")} disabled={transition.isPending}>
              {status === "published" ? "Unpublish to edit" : "Withdraw to edit"}
            </Button>
          )}
        </Container>
      </div>

      <div className={cx("grid flex-1", view === "split" && "lg:grid-cols-2")}>
        {/* Split view collapses to the editor on small screens; preview is its own tab there. */}
        {view !== "preview" && (
          <section aria-label="Editor" className={cx("px-4 py-8 sm:px-8", view === "split" && "lg:border-r lg:border-line")}>
            <div className="mx-auto flex max-w-[680px] flex-col gap-6">
              {note?.note && editable && <EditorNote entry={note} />}
              {!editable && (
                <p className="rounded-md bg-wash px-4 py-3 text-sm text-ink-2">
                  {status === "pending" ? "This story is with an editor, so it's locked for now. Withdraw it if you need to make changes." : "This story is live. Unpublishing takes it offline until an editor approves it again."}
                </p>
              )}
              <CoverPicker form={form} set={set} disabled={!editable} />
              <textarea
                aria-label="Title"
                value={form.title}
                readOnly={!editable}
                maxLength={140}
                rows={1}
                onChange={(e) => set({ title: e.target.value.replace(/\n/g, " ") })}
                placeholder="Title"
                className="headline field-sizing-content resize-none bg-transparent text-[2.4rem] placeholder:text-ink/20 focus:outline-none sm:text-5xl"
              />
              <textarea
                aria-label="Summary"
                value={form.dek}
                readOnly={!editable}
                maxLength={280}
                rows={1}
                onChange={(e) => set({ dek: e.target.value.replace(/\n/g, " ") })}
                placeholder="A one or two sentence summary that makes people want to read on"
                className="field-sizing-content resize-none bg-transparent font-serif text-[1.35rem] leading-snug text-ink-2 italic placeholder:text-ink/25 focus:outline-none"
              />
              <TagsInput tags={form.tags} onChange={(tags) => set({ tags })} disabled={!editable} />

              <div className="border-t border-line">
                {editable && (
                  <div role="toolbar" aria-label="Formatting" className="sticky top-30 z-10 -mx-1 flex flex-wrap items-center gap-0.5 bg-paper py-2">
                    {tools.map(([kind, Icon, label, key]) => (
                      <button key={kind} type="button" onClick={() => format(kind)} className="inline-flex size-9 items-center justify-center rounded-md text-ink-2 hover:bg-wash hover:text-ink" title={key ? `${label} (${key})` : label} aria-label={label}>
                        <Icon size={18} />
                      </button>
                    ))}
                    <button type="button" onClick={() => imageInput.current?.click()} className="inline-flex size-9 items-center justify-center rounded-md text-ink-2 hover:bg-wash hover:text-ink" title="Insert image" aria-label="Insert image">
                      <ImageIcon size={18} />
                    </button>
                    <input ref={imageInput} type="file" hidden accept="image/png,image/jpeg,image/webp,image/avif,image/gif" onChange={(e) => insertImage(e.target.files?.[0])} />
                  </div>
                )}
                <textarea
                  ref={area}
                  aria-label="Story, in Markdown"
                  value={form.body}
                  readOnly={!editable}
                  onChange={(e) => set({ body: e.target.value })}
                  onKeyDown={onKey}
                  onPaste={(e) => {
                    const file = [...e.clipboardData.files].find((f) => f.type.startsWith("image/"));
                    if (file) {
                      e.preventDefault();
                      insertImage(file);
                    }
                  }}
                  placeholder={"Start with a scene, a question or a surprising fact.\n\n## Use headings for sections\n\nThey become the table of contents."}
                  className="field-sizing-content min-h-[50vh] w-full resize-none bg-transparent pt-3 font-mono text-[15px] leading-[1.8] text-ink placeholder:text-ink/30 focus:outline-none"
                />
              </div>
              <p className="border-t border-line pt-3 text-[13px] text-muted">
                {plural(words, "word")} · {minutes} min read
                {editable && words < 80 && <span> · Editors review stories of 80 words or more</span>}
              </p>

              {draft.history.length > 1 && (
                <details className="border-t border-line pt-4">
                  <summary className="text-sm font-medium text-ink">Review history</summary>
                  <div className="pt-4"><Timeline history={draft.history} /></div>
                </details>
              )}
            </div>
          </section>
        )}
        {view !== "write" && (
          <section aria-label="Preview" className={cx("bg-paper px-4 sm:px-8", view === "split" && "hidden lg:block")}>
            <Preview form={form} />
          </section>
        )}
      </div>
    </div>
  );
}

export default function Write() {
  const { id } = useParams();
  const { data, error, isPending, refetch } = useDraft(id);
  if (error) return (error as { status?: number }).status === 403 || (error as { status?: number }).status === 404 ? <NotFound title="That draft isn't on your desk" body="It may belong to someone else, or it was deleted." /> : <Container className="py-16"><ErrorNote error={error} onRetry={() => refetch()} /></Container>;
  if (isPending)
    return (
      <Container className="flex max-w-[680px] flex-col gap-5 py-16">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-80 w-full" />
      </Container>
    );
  return <Editor key={data._id} draft={data} />;
}
