import { NotePencil, Stamp } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { Button, Container, Field, Input } from "../components/ui";
import { useDemoLogin } from "../hooks";
import { api } from "../lib/api";
import type { User } from "../lib/types";
import { useAuth } from "../store";

type Session = { token: string; user: User };

function useDebounced<T>(v: T, ms: number) {
  const [d, setD] = useState(v);
  useEffect(() => {
    const t = setTimeout(() => setD(v), ms);
    return () => clearTimeout(t);
  }, [v, ms]);
  return d;
}

export default function Auth({ mode }: { mode: "login" | "register" }) {
  const [params] = useSearchParams();
  const next = params.get("next") || "/";
  const navigate = useNavigate();
  const qc = useQueryClient();
  const setSession = useAuth((s) => s.setSession);
  const demo = useDemoLogin();
  const [f, setF] = useState({ name: "", handle: "", email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: k === "handle" ? e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") : e.target.value });

  const handle = useDebounced(f.handle, 350);
  const availability = useQuery({
    queryKey: ["handle", handle],
    queryFn: () => api<{ available: boolean; reason?: string }>(`/auth/handle-available?handle=${handle}`),
    enabled: mode === "register" && handle.length >= 3,
  });

  const submit = useMutation({
    mutationFn: () => api<Session>(mode === "login" ? "/auth/login" : "/auth/register", { method: "POST", body: mode === "login" ? { email: f.email, password: f.password } : f }),
    onSuccess: (s) => {
      qc.clear();
      setSession(s);
      toast.success(mode === "login" ? `Welcome back, ${s.user.name.split(" ")[0]}` : "Account created. Your desk is ready.");
      navigate(mode === "register" ? "/desk" : next, { replace: true });
    },
    onError: (e: Error) => setErrors({ form: e.message }),
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (mode === "register") {
      if (f.name.trim().length < 2) errs.name = "Enter your name";
      if (!/^[a-z0-9_]{3,20}$/.test(f.handle)) errs.handle = "3-20 characters: letters, numbers, underscore";
      else if (availability.data && !availability.data.available) errs.handle = "That handle is taken";
      if (f.password.length < 8) errs.password = "Use at least 8 characters";
    } else if (!f.password) errs.password = "Enter your password";
    if (!/^\S+@\S+\.\S+$/.test(f.email)) errs.email = "Enter a valid email";
    setErrors(errs);
    if (!Object.keys(errs).length) submit.mutate();
  };

  const handleHint =
    mode === "register" && handle.length >= 3 && availability.data
      ? availability.data.available ? `@${handle} is available` : availability.data.reason ?? `@${handle} is taken`
      : "Shown on your stories";

  return (
    <Container className="grid gap-14 py-12 lg:grid-cols-12 lg:gap-16 lg:py-20">
      <div className="flex max-w-md flex-col gap-8 lg:col-span-5">
        <div>
          <h1 className="headline text-5xl">{mode === "login" ? "Welcome back" : "Write for Folio"}</h1>
          <p className="mt-3 text-ink-2">
            {mode === "login" ? "New here? " : "Already have an account? "}
            <Link to={`/${mode === "login" ? "register" : "login"}${params.toString() ? `?${params}` : ""}`} className="font-medium text-accent hover:underline">
              {mode === "login" ? "Create an account" : "Sign in"}
            </Link>
          </p>
        </div>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
          {mode === "register" && (
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Name" error={errors.name}>
                {(id, d) => <Input id={id} aria-describedby={d} aria-invalid={!!errors.name} autoComplete="name" value={f.name} onChange={set("name")} />}
              </Field>
              <Field label="Handle" error={errors.handle} hint={handleHint}>
                {(id, d) => <Input id={id} aria-describedby={d} aria-invalid={!!errors.handle} autoComplete="username" value={f.handle} onChange={set("handle")} maxLength={20} />}
              </Field>
            </div>
          )}
          <Field label="Email" error={errors.email}>
            {(id, d) => <Input id={id} type="email" aria-describedby={d} aria-invalid={!!errors.email} autoComplete="email" value={f.email} onChange={set("email")} />}
          </Field>
          <Field label="Password" error={errors.password} hint={mode === "register" ? "At least 8 characters" : undefined}>
            {(id, d) => <Input id={id} type="password" aria-describedby={d} aria-invalid={!!errors.password} autoComplete={mode === "login" ? "current-password" : "new-password"} value={f.password} onChange={set("password")} />}
          </Field>
          {errors.form && <p role="alert" className="text-sm font-medium text-danger">{errors.form}</p>}
          <Button type="submit" size="lg" disabled={submit.isPending}>
            {submit.isPending ? "One moment" : mode === "login" ? "Sign in" : "Create account"}
          </Button>
          {mode === "register" && <p className="text-[13px] text-muted">New accounts are writers. Your stories go to an editor before they're published.</p>}
        </form>
      </div>

      <aside className="flex flex-col gap-6 lg:col-span-6 lg:col-start-7">
        <h2 className="headline text-3xl">Or try a desk without signing up</h2>
        <div className="grid gap-px border border-line bg-line sm:grid-cols-2">
          {(
            [
              ["writer", NotePencil, "The demo writer has a story back from the editor with notes, and a draft in progress."],
              ["editor", Stamp, "The demo editor has three stories in the review queue, one of them resubmitted with changes."],
            ] as const
          ).map(([as, Icon, text]) => (
            <div key={as} className="flex flex-col gap-4 bg-paper p-6">
              <Icon size={28} className="text-accent" />
              <h3 className="headline text-2xl capitalize">{as}</h3>
              <p className="flex-1 text-[15px] leading-relaxed text-ink-2">{text}</p>
              <Button variant={as === "writer" ? "primary" : "secondary"} onClick={() => demo.mutate(as)} disabled={demo.isPending}>
                Continue as {as}
              </Button>
            </div>
          ))}
        </div>
        <p className="text-[13px] text-muted">Demo work is only visible to other demo sessions and resets on its own.</p>
      </aside>
    </Container>
  );
}
