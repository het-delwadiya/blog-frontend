import { forwardRef, useId, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { Link, type LinkProps } from "react-router";
import { assetUrl } from "../lib/api";
import type { Author, Status } from "../lib/types";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

// Shape rule: buttons and chips are pills, fields are 6px, images and panels are square.

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-paper hover:bg-accent-2",
  secondary: "border border-ink/20 bg-paper text-ink hover:border-ink/50",
  ghost: "text-ink-2 hover:bg-ink/5 hover:text-ink",
  danger: "border border-danger/30 bg-paper text-danger hover:border-danger",
};
const sizes: Record<Size, string> = { sm: "h-8 px-3.5 text-[13px]", md: "h-10 px-5 text-sm", lg: "h-12 px-6 text-[15px]" };
const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-[background-color,border-color,color,transform] duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45";

export const buttonClass = (variant: Variant = "primary", size: Size = "md", extra?: string) => cx(base, variants[variant], sizes[size], extra);

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }>(
  ({ variant = "primary", size = "md", className, type = "button", ...rest }, ref) => <button ref={ref} type={type} className={buttonClass(variant, size, className)} {...rest} />,
);

export const ButtonLink = ({ variant = "primary", size = "md", className, ...rest }: LinkProps & { variant?: Variant; size?: Size }) => (
  <Link className={buttonClass(variant, size, className)} {...rest} />
);

// ---------- fields ----------

const inputBase =
  "w-full rounded-md border border-ink/20 bg-paper px-3 text-[15px] text-ink placeholder:text-muted transition-colors hover:border-ink/35 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 aria-[invalid=true]:border-danger";

export function Field({ label, error, hint, children, className }: { label: string; error?: string; hint?: ReactNode; children: (id: string, describedBy?: string) => ReactNode; className?: string }) {
  const id = useId();
  const d = error ? `${id}-e` : hint ? `${id}-h` : undefined;
  return (
    <div className={cx("flex flex-col gap-2", className)}>
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      {children(id, d)}
      {error ? <p id={d} className="text-[13px] font-medium text-danger">{error}</p> : hint ? <p id={d} className="text-[13px] text-muted">{hint}</p> : null}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...rest }, ref) => (
  <input ref={ref} className={cx(inputBase, "h-11", className)} {...rest} />
));
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...rest }, ref) => (
  <textarea ref={ref} className={cx(inputBase, "py-2.5 leading-relaxed", className)} {...rest} />
));

// ---------- display ----------

const AVATAR_TINTS = ["#dfeae3", "#e6e3dc", "#dde6ec", "#ece2e2", "#e4e6da", "#e2dfea"];
const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

export function Avatar({ user, size = 36, className }: { user: Pick<Author, "name" | "handle" | "avatar">; size?: number; className?: string }) {
  const initials = user.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return user.avatar ? (
    <img src={assetUrl(user.avatar)} alt="" width={size} height={size} className={cx("shrink-0 rounded-full object-cover", className)} style={{ width: size, height: size }} />
  ) : (
    <span
      aria-hidden
      className={cx("inline-flex shrink-0 items-center justify-center rounded-full font-serif font-semibold text-ink-2", className)}
      style={{ width: size, height: size, background: AVATAR_TINTS[hash(user.handle) % AVATAR_TINTS.length], fontSize: size * 0.4 }}
    >
      {initials}
    </span>
  );
}

const STATUS: Record<Status, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-wash text-ink-2" },
  pending: { label: "In review", className: "bg-ink text-paper" },
  changes: { label: "Changes requested", className: "bg-amber-soft text-amber" },
  rejected: { label: "Declined", className: "bg-danger-soft text-danger" },
  published: { label: "Published", className: "bg-accent-soft text-accent-2" },
};

export const StatusBadge = ({ status, className }: { status: Status; className?: string }) => (
  <span className={cx("inline-flex h-6 items-center rounded-full px-2.5 text-xs font-medium", STATUS[status].className, className)}>{STATUS[status].label}</span>
);

export const TagLink = ({ tag, className }: { tag: string; className?: string }) => (
  <Link to={`/topic/${tag}`} className={cx("text-[13px] font-medium capitalize text-accent hover:underline", className)}>
    {tag}
  </Link>
);

export const Skeleton = ({ className }: { className?: string }) => <div aria-hidden className={cx("animate-pulse bg-ink/[0.06]", className)} />;

export function EmptyState({ title, body, action }: { title: string; body?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-3 border-t border-ink py-10">
      <h3 className="headline text-2xl">{title}</h3>
      {body && <p className="max-w-[52ch] text-ink-2">{body}</p>}
      {action}
    </div>
  );
}

export function ErrorNote({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
      {error instanceof Error ? error.message : "Something went wrong"}
      {onRetry && (
        <Button size="sm" variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export const Container = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cx("mx-auto w-full max-w-[1240px] px-4 sm:px-6 lg:px-8", className)}>{children}</div>
);
