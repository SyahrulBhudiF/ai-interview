import { Button } from "@ai-interview/ui/button";
import { cn } from "@ai-interview/ui/utils";
import { Link, useRouterState } from "@tanstack/react-router";
import { FileSearch, Mic, Plus, TrendingUp } from "lucide-react";

const links = [
  { to: "/interviews", label: "Interviews", icon: Mic },
  { to: "/cv-reviews", label: "CV review", icon: FileSearch },
  { to: "/progress", label: "Progress", icon: TrendingUp },
] as const;

function NavLinks({ pathname }: { pathname: string }) {
  return (
    <nav aria-label="Main" className="flex items-center gap-1">
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
              "focus-visible:ring-ring/50 flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-[3px] sm:px-4",
              active
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon aria-hidden className="size-4 shrink-0" />
            <span className="hidden md:inline">{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function SiteHeader() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <header className="sticky top-0 z-40 px-4 pt-3 sm:px-6 sm:pt-4">
      <div
        aria-hidden
        className="bg-background pointer-events-none absolute inset-x-0 top-0 -z-10 h-3 sm:h-4"
      />
      <div className="bg-card mx-auto flex h-14 w-fit max-w-full items-center gap-2 rounded-full pr-1.5 pl-2 shadow-lg">
        <Link
          to="/"
          className="focus-visible:ring-ring/50 flex items-center gap-2.5 rounded-full py-1 pr-2 pl-0.5 outline-none focus-visible:ring-[3px]"
        >
          <span className="bg-primary text-primary-foreground grid size-9 shrink-0 place-items-center rounded-full font-serif text-lg leading-none">
            A
          </span>
          <span className="hidden font-serif text-lg leading-none tracking-tight sm:inline">
            AI Interview
          </span>
        </Link>
        <NavLinks pathname={pathname} />
        {pathname === "/interviews/new" ? null : (
          <Button asChild className="rounded-full">
            <Link to="/interviews/new" aria-label="New interview">
              <Plus aria-hidden />
              <span className="hidden sm:inline">New interview</span>
            </Link>
          </Button>
        )}
      </div>
    </header>
  );
}
