import { timeAgo } from "../lib/format";
import type { HistoryEntry } from "../lib/types";
import { cx } from "./ui";

const LABEL: Record<HistoryEntry["action"], string> = {
  created: "Started the draft",
  submitted: "Submitted for review",
  approved: "Approved and published",
  changes: "Asked for changes",
  rejected: "Declined",
  withdrawn: "Withdrew it to edit",
};

const who = (h: HistoryEntry) => (typeof h.by === "object" && h.by ? h.by.name : "");

/** The latest editor decision that came with a note, if it's still the newest event. */
export function openNote(history: HistoryEntry[] = []) {
  const last = history.at(-1);
  return last && (last.action === "changes" || last.action === "rejected") ? last : undefined;
}

export function EditorNote({ entry, className }: { entry: HistoryEntry; className?: string }) {
  const declined = entry.action === "rejected";
  return (
    <figure className={cx("border-l-[3px] py-1 pl-5", declined ? "border-danger" : "border-amber", className)}>
      <figcaption className={cx("text-[13px] font-medium", declined ? "text-danger" : "text-amber")}>
        {declined ? "Declined" : "Changes requested"} by {who(entry) || "an editor"}, {timeAgo(entry.at)}
      </figcaption>
      <blockquote className="mt-1.5 max-w-[62ch] font-serif text-lg leading-snug text-ink">{entry.note}</blockquote>
    </figure>
  );
}

export function Timeline({ history }: { history: HistoryEntry[] }) {
  return (
    <ol className="flex flex-col">
      {[...history].reverse().map((h, i) => (
        <li key={i} className="relative flex gap-3 pb-5 pl-5 last:pb-0">
          <span aria-hidden className="absolute top-[7px] left-0 size-2 rounded-full bg-ink/25 ring-4 ring-paper" />
          {i < history.length - 1 && <span aria-hidden className="absolute top-3 bottom-0 left-[3.5px] w-px bg-line" />}
          <div className="flex flex-col gap-1">
            <p className="text-sm text-ink">
              <span className="font-medium">{who(h)}</span> {LABEL[h.action].toLowerCase()}
            </p>
            <time dateTime={h.at} className="text-[12px] text-muted">{timeAgo(h.at)}</time>
            {h.note && <p className="mt-1 font-serif text-[15px] leading-snug text-ink-2 italic">“{h.note}”</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
