import { useMutation } from "@tanstack/react-query";
import { useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Avatar, Button, Container, Field, Input, Textarea } from "../components/ui";
import { api, uploadImage } from "../lib/api";
import type { User } from "../lib/types";
import { useAuth } from "../store";

export default function Settings() {
  const user = useAuth((s) => s.user)!;
  const setUser = useAuth((s) => s.setUser);
  const [f, setF] = useState({ name: user.name, bio: user.bio ?? "", avatar: user.avatar ?? "" });
  const [uploading, setUploading] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const locked = !!user.demo;

  const save = useMutation({
    mutationFn: () => api<User>("/auth/me", { method: "PATCH", body: f }),
    onSuccess: (u) => {
      setUser(u);
      toast.success("Profile saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const pickAvatar = async (picked?: File) => {
    if (!picked) return;
    setUploading(true);
    try {
      const { url } = await uploadImage(picked, "avatar");
      setF((x) => ({ ...x, avatar: url }));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (f.name.trim().length < 2) return toast.error("Your name needs at least 2 characters");
    save.mutate();
  };

  return (
    <Container className="max-w-[640px] pt-12">
      <h1 className="headline text-5xl">Settings</h1>
      <p className="mt-3 text-ink-2">This is what readers see on your stories and writer page.</p>
      {locked && <p className="mt-6 rounded-md bg-amber-soft px-4 py-3 text-sm text-amber">The shared demo profile is locked. Create your own account to edit a profile.</p>}
      <form onSubmit={submit} className="mt-10 flex flex-col gap-7 border-t border-ink pt-8">
        <div className="flex items-center gap-5">
          <Avatar user={{ ...user, avatar: f.avatar || undefined }} size={80} />
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" disabled={locked || uploading} onClick={() => file.current?.click()}>
              {uploading ? "Uploading" : "Upload photo"}
            </Button>
            {f.avatar && (
              <Button variant="ghost" size="sm" disabled={locked} onClick={() => setF({ ...f, avatar: "" })}>
                Remove
              </Button>
            )}
            <input ref={file} type="file" hidden accept="image/png,image/jpeg,image/webp,image/avif" onChange={(e) => pickAvatar(e.target.files?.[0])} />
          </div>
        </div>
        <Field label="Name">
          {(id) => <Input id={id} disabled={locked} value={f.name} maxLength={60} onChange={(e) => setF({ ...f, name: e.target.value })} autoComplete="name" />}
        </Field>
        <Field label="Bio" hint={`${400 - f.bio.length} characters left. Shown under your stories.`}>
          {(id, d) => <Textarea id={id} aria-describedby={d} disabled={locked} rows={4} maxLength={400} value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} className="font-serif text-lg" />}
        </Field>
        <Field label="Email" hint="Used to sign in. Never shown publicly.">
          {(id, d) => <Input id={id} aria-describedby={d} value={user.email} disabled readOnly />}
        </Field>
        <Button type="submit" size="lg" disabled={locked || save.isPending} className="self-start">
          {save.isPending ? "Saving" : "Save profile"}
        </Button>
      </form>
    </Container>
  );
}
