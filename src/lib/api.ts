import { useAuth } from "../store";

export const API_URL: string = import.meta.env.VITE_API_URL ?? "http://localhost:8010/blog/api";
export const API_BASE = API_URL.replace(/\/api\/?$/, ""); // e.g. https://api.example.com/blog

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

interface Options {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  form?: FormData;
}

export async function api<T>(path: string, { method = "GET", body, form }: Options = {}): Promise<T> {
  const token = useAuth.getState().token;
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  let res: Response;
  try {
    res = await fetch(API_URL + path, { method, headers, body: form ?? (body !== undefined ? JSON.stringify(body) : undefined) });
  } catch {
    throw new ApiError(0, "Can't reach Folio right now. Check your connection.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) useAuth.getState().logout();
    throw new ApiError(res.status, data.error || "Something went wrong");
  }
  return data as T;
}

export const assetUrl = (path?: string) => (path ? (path.startsWith("http") ? path : API_BASE + path) : undefined);

export const qs = (params: Record<string, string | number | boolean | undefined | null>) => {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== "" && v !== false) s.set(k, String(v));
  const str = s.toString();
  return str ? `?${str}` : "";
};

export async function uploadImage(file: File, kind: "avatar" | "cover" | "inline") {
  const fd = new FormData();
  fd.append("kind", kind);
  fd.append("image", file);
  return api<{ url: string }>("/uploads", { method: "POST", form: fd });
}
