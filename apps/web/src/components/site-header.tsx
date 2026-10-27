import { Button } from "@ai-interview/ui/button";
import { Link, useRouterState } from "@tanstack/react-router";

const links = [
  { to: "/interviews", label: "Interviews" },
  { to: "/progress", label: "Progress" },
] as const;

function NavLinks({ pathname, className }: { pathname: string; className: string }) {
  return (
    <nav className={className} aria-label="Main">
      {links.map((link) => {
        const active = pathname === link.to || pathname.startsWith(`${link.to}/`);

        return (
          <Link
            key={link.to}
            to={link.to}
            className={
              active
                ? "bg-muted text-foreground rounded-md px-3 py-2 text-sm font-medium"
                : "text-muted-foreground hover:text-foreground rounded-md px-3 py-2 text-sm font-medium transition-colors"
            }
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
    <header className="bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-6 px-6">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="bg-primary text-primary-foreground grid size-8 place-items-center rounded-lg font-serif text-lg leading-none">
              A
            </span>
            <span className="text-[15px] font-semibold tracking-tight">AI Interview</span>
          </Link>
          <NavLinks pathname={pathname} className="hidden items-center gap-1 sm:flex" />
        </div>
        {pathname === "/interviews/new" ? null : (
          <Button asChild size="sm">
            <Link to="/interviews/new">New interview</Link>
          </Button>
        )}
      </div>
      <div className="border-t sm:hidden">
        <NavLinks
          pathname={pathname}
          className="mx-auto flex max-w-5xl items-center gap-1 px-4 py-2"
        />
      </div>
    </header>
  );
}
