import { BookmarkSimple, Gear, MagnifyingGlass, NotePencil, SignOut, Stack, User as UserIcon, UsersThree } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router";
import { useDemoLogin, useReviewCount } from "../hooks";
import { API_URL } from "../lib/api";
import type { User } from "../lib/types";
import { isEditor, useAuth } from "../store";
import { Avatar, Button, Container, buttonClass, cx } from "./ui";

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" className={cx("font-serif text-[1.85rem] leading-none font-semibold tracking-[-0.03em] text-ink", className)} aria-label="Folio home">
      Folio<span className="text-accent">.</span>
    </Link>
  );
}

function AccountMenu({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const logout = useAuth((s) => s.logout);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  useEffect(() => {
    setOpen(false);
  }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);
  const item = "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-ink-2 hover:bg-wash hover:text-ink";
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="menu" aria-label="Account menu" className="flex rounded-full">
        <Avatar user={user} size={34} />
      </button>
      {open && (
        <div role="menu" className="absolute top-12 right-0 z-40 w-60 border border-line bg-paper py-1.5 shadow-[0_12px_40px_-12px_rgba(21,24,26,0.25)]">
          <div className="border-b border-line px-4 pt-2 pb-3">
            <p className="truncate font-medium">{user.name}</p>
            <p className="truncate text-[13px] text-muted">
              @{user.handle} · <span className="capitalize">{user.demo ? `demo ${user.role}` : user.role}</span>
            </p>
          </div>
          <Link role="menuitem" to={`/writers/${user.handle}`} className={item}>
            <UserIcon size={18} /> Profile
          </Link>
          <Link role="menuitem" to="/desk" className={item}>
            <Stack size={18} /> Your stories
          </Link>
          <Link role="menuitem" to="/saved" className={item}>
            <BookmarkSimple size={18} /> Reading list
          </Link>
          {user.role === "admin" && (
            <Link role="menuitem" to="/team" className={item}>
              <UsersThree size={18} /> Team
            </Link>
          )}
          <Link role="menuitem" to="/settings" className={item}>
            <Gear size={18} /> Settings
          </Link>
          <button
            role="menuitem"
            type="button"
            className={cx(item, "border-t border-line text-danger hover:text-danger")}
            onClick={() => {
              logout();
              qc.clear();
              navigate("/");
            }}
          >
            <SignOut size={18} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

const navClass = ({ isActive }: { isActive: boolean }) =>
  cx("relative py-1 text-[15px] transition-colors", isActive ? "text-ink after:absolute after:inset-x-0 after:-bottom-[21px] after:h-0.5 after:bg-accent" : "text-ink-2 hover:text-ink");

function Header() {
  const user = useAuth((s) => s.user);
  const { data: queue } = useReviewCount();
  const demo = useDemoLogin();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/92 backdrop-blur-md">
      <Container className="flex h-16 items-center gap-6">
        <Logo />
        <nav aria-label="Main" className="ml-4 hidden items-center gap-6 md:flex">
          <NavLink to="/" end className={navClass}>Today</NavLink>
          <NavLink to="/stories" className={navClass}>All stories</NavLink>
          <NavLink to="/topics" className={navClass}>Topics</NavLink>
          {isEditor(user) && (
            <NavLink to="/review" className={navClass}>
              Review
              {!!queue?.pending && <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-semibold text-paper">{queue.pending}</span>}
            </NavLink>
          )}
        </nav>
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <Link to="/search" className="inline-flex size-10 items-center justify-center rounded-full text-ink-2 hover:bg-wash hover:text-ink" aria-label="Search stories">
            <MagnifyingGlass size={20} />
          </Link>
          {user ? (
            <>
              <Link to="/desk" className={buttonClass("secondary", "sm", "hidden sm:inline-flex")}>
                <NotePencil size={16} /> Write
              </Link>
              <AccountMenu user={user} />
            </>
          ) : (
            <>
              <Link to="/login" className={buttonClass("ghost", "sm")}>Sign in</Link>
              <Button size="sm" className="hidden sm:inline-flex" onClick={() => demo.mutate("writer")} disabled={demo.isPending}>Try the demo</Button>
            </>
          )}
        </div>
      </Container>
      {/* Small screens: the section links live in a scrollable strip under the bar. */}
      <nav aria-label="Sections" className="flex gap-6 overflow-x-auto border-t border-line px-4 py-2.5 text-sm md:hidden">
        <NavLink to="/" end className={({ isActive }) => (isActive ? "text-accent" : "text-ink-2")}>Today</NavLink>
        <NavLink to="/stories" className={({ isActive }) => (isActive ? "text-accent" : "text-ink-2")}>All stories</NavLink>
        <NavLink to="/topics" className={({ isActive }) => (isActive ? "text-accent" : "text-ink-2")}>Topics</NavLink>
        {user && <NavLink to="/desk" className={({ isActive }) => (isActive ? "text-accent" : "text-ink-2")}>Write</NavLink>}
        {isEditor(user) && <NavLink to="/review" className={({ isActive }) => (isActive ? "text-accent" : "text-ink-2")}>Review{queue?.pending ? ` (${queue.pending})` : ""}</NavLink>}
      </nav>
    </header>
  );
}

function SampleBanner() {
  const user = useAuth((s) => s.user);
  return (
    <div className="bg-accent-2 text-[13px] text-paper/90">
      <Container className="py-2">
        {user?.demo
          ? `You're on the shared demo ${user.role} account. Stories you write are only visible to demo sessions and clear after a day.`
          : "Sample magazine: the writers, editors and stories here are fictional demo content."}
      </Container>
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-24 border-t border-ink">
      <Container className="grid gap-10 py-12 md:grid-cols-12">
        <div className="flex flex-col gap-3 md:col-span-5">
          <Logo className="text-4xl" />
          <p className="max-w-[40ch] font-serif text-lg leading-snug text-ink-2">Essays, edited. Every story here passed an editor before you saw it.</p>
        </div>
        <div className="flex flex-col gap-2.5 text-sm md:col-span-3">
          <p className="font-medium text-ink">Read</p>
          <Link to="/stories" className="text-ink-2 hover:text-accent">All stories</Link>
          <Link to="/topics" className="text-ink-2 hover:text-accent">Topics</Link>
          <a href={`${API_URL}/rss.xml`} className="text-ink-2 hover:text-accent">RSS feed</a>
        </div>
        <div className="flex flex-col gap-2.5 text-sm md:col-span-4">
          <p className="font-medium text-ink">The project</p>
          <a href="https://github.com/het-delwadiya/blog-frontend" target="_blank" rel="noreferrer" className="text-ink-2 hover:text-accent">Frontend source</a>
          <a href="https://github.com/het-delwadiya/blog-backend" target="_blank" rel="noreferrer" className="text-ink-2 hover:text-accent">Backend source</a>
          <a href="https://hetdelwadiya.dev" target="_blank" rel="noreferrer" className="text-ink-2 hover:text-accent">Built by Het Delwadiya</a>
        </div>
      </Container>
      <Container className="border-t border-line py-5 text-[13px] text-muted">Cover photos are public domain, via rawpixel. Writers and stories are fictional.</Container>
    </footer>
  );
}

export function Layout() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  const bare = pathname.startsWith("/write/");
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:text-paper">
        Skip to content
      </a>
      <SampleBanner />
      <Header />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      {!bare && <Footer />}
    </div>
  );
}
