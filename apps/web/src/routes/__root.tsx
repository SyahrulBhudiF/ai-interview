import { Toaster } from "@ai-interview/ui/sonner";
import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { AppShell } from "@/components/app-shell";

import appCss from "@/styles/globals.css?url";

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "AI Interview" },
      {
        name: "description",
        content:
          "Practice role-specific interview questions with Gemini, review your answers, and find what to work on next.",
      },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  component: RootDocument,
});

function RootDocument() {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="bg-background text-foreground font-sans antialiased">
        <AppShell>
          <Outlet />
        </AppShell>
        <Toaster position="bottom-right" richColors closeButton />
        <TanStackRouterDevtools position="bottom-left" />
        <Scripts />
      </body>
    </html>
  );
}
