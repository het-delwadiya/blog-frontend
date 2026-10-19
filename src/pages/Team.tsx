import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Navigate } from "react-router";
import { toast } from "sonner";
import { Avatar, Container, ErrorNote, Skeleton } from "../components/ui";
import { api } from "../lib/api";
import { shortDate } from "../lib/format";
import type { User } from "../lib/types";
import { useAuth } from "../store";

export default function Team() {
  const me = useAuth((s) => s.user)!;
  const qc = useQueryClient();
  const { data, error, isPending, refetch } = useQuery({ queryKey: ["team"], queryFn: () => api<User[]>("/team"), enabled: me.role === "admin" });
  const setRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => api(`/team/${id}`, { method: "PATCH", body: { role } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team"] });
      toast.success("Role updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  if (me.role !== "admin") return <Navigate to="/" replace />;

  return (
    <Container className="max-w-[880px] pt-12">
      <h1 className="headline text-5xl">Team</h1>
      <p className="mt-3 text-ink-2">Everyone starts as a writer. Editors can review and publish other people's stories.</p>
      {error ? (
        <div className="mt-8"><ErrorNote error={error} onRetry={() => refetch()} /></div>
      ) : isPending ? (
        <Skeleton className="mt-8 h-64" />
      ) : (
        <ul className="mt-8 divide-y divide-line border-t border-ink">
          {data.map((u) => (
            <li key={u._id} className="flex flex-wrap items-center gap-4 py-4">
              <Avatar user={u} size={40} />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{u.name}</p>
                <p className="truncate text-[13px] text-muted">
                  {u.email} · joined {shortDate(u.createdAt)}
                </p>
              </div>
              {u.role === "admin" ? (
                <span className="text-sm text-muted">Admin</span>
              ) : (
                <select
                  aria-label={`Role for ${u.name}`}
                  value={u.role}
                  disabled={setRole.isPending}
                  onChange={(e) => setRole.mutate({ id: u._id, role: e.target.value })}
                  className="h-9 rounded-md border border-ink/20 bg-paper px-3 text-sm"
                >
                  <option value="writer">Writer</option>
                  <option value="editor">Editor</option>
                </select>
              )}
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
