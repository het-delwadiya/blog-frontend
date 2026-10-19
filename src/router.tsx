import { lazy, Suspense, type ReactNode } from "react";
import { createBrowserRouter, Navigate, useLocation } from "react-router";
import { Layout } from "./components/Layout";
import { Container, Skeleton } from "./components/ui";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import { isEditor, useAuth } from "./store";

const Stories = lazy(() => import("./pages/Stories"));
const Topics = lazy(() => import("./pages/Topics"));
const Read = lazy(() => import("./pages/Read"));
const Writer = lazy(() => import("./pages/Writer"));
const Desk = lazy(() => import("./pages/Desk"));
const Write = lazy(() => import("./pages/Write"));
const Review = lazy(() => import("./pages/Review"));
const ReviewStory = lazy(() => import("./pages/ReviewStory"));
const Saved = lazy(() => import("./pages/Saved"));
const Settings = lazy(() => import("./pages/Settings"));
const Team = lazy(() => import("./pages/Team"));
const Auth = lazy(() => import("./pages/Auth"));

const Fallback = () => (
  <Container className="flex flex-col gap-5 py-16">
    <Skeleton className="h-4 w-28" />
    <Skeleton className="h-12 w-3/4 max-w-2xl" />
    <Skeleton className="h-64 w-full" />
  </Container>
);
const page = (el: ReactNode) => <Suspense fallback={<Fallback />}>{el}</Suspense>;

function RequireAuth({ children, editor }: { children: ReactNode; editor?: boolean }) {
  const user = useAuth((s) => s.user);
  const loc = useLocation();
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname)}`} replace />;
  if (editor && !isEditor(user)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/stories", element: page(<Stories mode="all" />) },
      { path: "/topic/:tag", element: page(<Stories mode="topic" />) },
      { path: "/search", element: page(<Stories mode="search" />) },
      { path: "/topics", element: page(<Topics />) },
      { path: "/read/:slug", element: page(<Read />) },
      { path: "/writers/:handle", element: page(<Writer />) },
      { path: "/desk", element: page(<RequireAuth><Desk /></RequireAuth>) },
      { path: "/write/:id", element: page(<RequireAuth><Write /></RequireAuth>) },
      { path: "/review", element: page(<RequireAuth editor><Review /></RequireAuth>) },
      { path: "/review/:id", element: page(<RequireAuth editor><ReviewStory /></RequireAuth>) },
      { path: "/saved", element: page(<RequireAuth><Saved /></RequireAuth>) },
      { path: "/settings", element: page(<RequireAuth><Settings /></RequireAuth>) },
      { path: "/team", element: page(<RequireAuth><Team /></RequireAuth>) },
      { path: "/login", element: page(<Auth mode="login" />) },
      { path: "/register", element: page(<Auth mode="register" />) },
      { path: "*", element: <NotFound /> },
    ],
  },
]);
