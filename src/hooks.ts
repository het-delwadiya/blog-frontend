import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { api, qs } from "./lib/api";
import type { Card, Comment, Draft, Page, Profile, Story, User } from "./lib/types";
import { isEditor, useAuth } from "./store";

export interface StoryQuery {
  tag?: string;
  author?: string;
  q?: string;
  page?: number;
  limit?: number;
}

export const useStories = (q: StoryQuery, enabled = true) => {
  const token = useAuth((s) => s.token);
  return useQuery({ queryKey: ["stories", q, !!token], queryFn: () => api<Page<Card>>(`/posts${qs({ ...q })}`), placeholderData: (prev) => prev, enabled });
};
export const useStory = (slug?: string) => useQuery({ queryKey: ["story", slug], queryFn: () => api<Story>(`/posts/${slug}`), enabled: !!slug });
export const useTags = () => useQuery({ queryKey: ["tags"], queryFn: () => api<{ tag: string; count: number }[]>("/tags"), staleTime: 5 * 60_000 });
export const useProfile = (handle?: string) => useQuery({ queryKey: ["profile", handle], queryFn: () => api<Profile>(`/users/${handle}`), enabled: !!handle });
export const useComments = (id?: string) => useQuery({ queryKey: ["comments", id], queryFn: () => api<Comment[]>(`/posts/${id}/comments`), enabled: !!id });

export const useMyStories = () => useQuery({ queryKey: ["mine"], queryFn: () => api<Card[]>("/me/posts") });
export const useDraft = (id?: string) => useQuery({ queryKey: ["draft", id], queryFn: () => api<Draft>(`/posts/${id}/edit`), enabled: !!id, staleTime: 0 });
export const useSaved = () => useQuery({ queryKey: ["saved"], queryFn: () => api<Card[]>("/me/saved") });

export const useReviewQueue = () => useQuery({ queryKey: ["review"], queryFn: () => api<{ pending: Card[]; recent: Card[] }>("/review"), staleTime: 0 });
export const useReviewCount = () => {
  const user = useAuth((s) => s.user);
  return useQuery({ queryKey: ["review-count"], queryFn: () => api<{ pending: number }>("/review/count"), enabled: isEditor(user), refetchInterval: 60_000 });
};

export function useSave(story: Pick<Card, "_id"> & { saved?: boolean }) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (save: boolean) => api<{ saved: boolean }>(`/posts/${story._id}/save`, { method: save ? "POST" : "DELETE" }),
    onSuccess: (r) => {
      qc.setQueriesData<Story>({ queryKey: ["story"] }, (old) => (old && old._id === story._id ? { ...old, saved: r.saved } : old));
      qc.invalidateQueries({ queryKey: ["saved"] });
      toast.success(r.saved ? "Saved to your reading list" : "Removed from your reading list");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDemoLogin() {
  const setSession = useAuth((s) => s.setSession);
  const navigate = useNavigate();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (as: "writer" | "editor") => api<{ token: string; user: User }>("/auth/demo", { method: "POST", body: { as } }),
    onSuccess: (s, as) => {
      qc.clear();
      setSession(s);
      toast.success(as === "editor" ? "Signed in as the demo editor. Three stories are waiting." : "Signed in as the demo writer. One story is back with notes.");
      navigate(as === "editor" ? "/review" : "/desk");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
