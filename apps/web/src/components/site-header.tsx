import { Button } from "@ai-interview/ui/button";
import { cn } from "@ai-interview/ui/utils";
import { Link, useRouterState } from "@tanstack/react-router";
import { FileSearch, MessageCircle, Mic, Plus, TrendingUp } from "lucide-react";
import { motion } from "motion/react";

const links = [
  { to: "/interviews", label: "Interviews", icon: Mic },
  { to: "/cv-reviews", label: "CV review", icon: FileSearch },
  { to: "/progress", label: "Progress", icon: TrendingUp },
] as const;

function NavLinks({ pathname }: { pathname: string }) {
  return (
    <nav
      aria-label="Main"
      className="col-span-2 col-start-1 row-start-2 grid grid-cols-3 gap-1 md:col-span-1 md:col-start-2 md:row-start-1 md:flex md:justify-center"
    >
      {links.map((link) => {
        const active = pathname === link.to || pathname.startsWith(`${link.to}/`);
        const Icon = link.icon;

        return (
          <Link
            key={link.to}
            to={link.to}
            aria-current={active ? "page" : undefined}
            aria-label={link.label}
            className={cn(
              "focus-visible:ring-ring/50 relative flex min-h-11 items-center justify-center gap-2 rounded-full px-2 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-[3px] sm:px-4",
              active
                ? "text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {active ? (
              <motion.span
                aria-hidden
                layoutId="active-navigation"
                className="bg-secondary absolute inset-0 rounded-full"
                transition={{ type: "tween" }}
              />
            ) : null}
            <Icon aria-hidden className="relative hidden size-4 shrink-0 sm:block" />
            <span className="relative">{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function SiteHeader() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <header className="bg-background sticky top-0 z-40 px-3 pt-3 sm:px-6">
      <div className="bg-card mx-auto grid max-w-6xl grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 rounded-3xl px-3 py-2 shadow-sm md:grid-cols-[auto_1fr_auto] md:px-5">
        <Link
          to="/"
          aria-label="AI Interview home"
          className="focus-visible:ring-ring/50 flex min-h-11 items-center gap-2.5 rounded-full px-1 outline-none focus-visible:ring-[3px]"
        >
          <span className="bg-primary text-primary-foreground grid size-8 shrink-0 place-items-center rounded-full">
            <MessageCircle aria-hidden className="size-4" />
          </span>
          <span className="text-base leading-none font-semibold tracking-tight sm:text-lg">
            AI Interview
          </span>
        </Link>
        <NavLinks pathname={pathname} />
        <Button asChild className="col-start-2 row-start-1 h-11 px-4 md:col-start-3">
          <Link
            to="/interviews/new"
            aria-label="New interview"
            aria-current={pathname === "/interviews/new" ? "page" : undefined}
          >
            <Plus aria-hidden />
            <span>
              New<span className="hidden sm:inline"> interview</span>
            </span>
          </Link>
        </Button>
      </div>
    </header>
  );
}
