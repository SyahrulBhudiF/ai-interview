import { Button } from "@ai-interview/ui/button";
import { cn } from "@ai-interview/ui/utils";
import { Link, useRouterState } from "@tanstack/react-router";
import { Plus } from "lucide-react";

const links = [
  { to: "/interviews", label: "Interviews" },
  { to: "/progress", label: "Progress" },
] as const;

function NavLinks({ pathname }: { pathname: string }) {
  return (
    <nav aria-label="Main" className="bg-muted/70 flex items-center gap-0.5 rounded-full p-1">
      {links.map((link) => {
        const active = pathname === link.to || pathname.startsWith(`${link.to}/`);

        return (
          <Link
            key={link.to}
            to={link.to}
            aria-current={active ? "page" : undefined}
            className={cn(
              "focus-visible:ring-ring/50 rounded-full px-2.5 py-1.5 text-[13px] font-medium transition-colors outline-none focus-visible:ring-[3px] sm:px-3 sm:text-sm",
              active
                ? "bg-card text-foreground ring-border shadow-xs ring-1"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {link.label}
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
      <div className="border-border/70 bg-card mx-auto flex h-12 w-fit max-w-full items-center gap-2 rounded-full border pr-1.5 pl-2 shadow-lg">
        <div className="flex min-w-0 items-center gap-2.5">
          <Link
            to="/"
            className="focus-visible:ring-ring/50 flex items-center gap-2 rounded-full py-1 pr-1 outline-none focus-visible:ring-[3px]"
          >
            <span className="bg-primary text-primary-foreground grid size-8 shrink-0 place-items-center rounded-full font-serif text-lg leading-none">
              A
            </span>
            <span className="hidden font-serif text-lg leading-none tracking-tight sm:inline">
              AI Interview
            </span>
          </Link>
          <NavLinks pathname={pathname} />
        </div>
        {pathname === "/interviews/new" ? null : (
          <Button asChild size="sm" className="rounded-full">
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
