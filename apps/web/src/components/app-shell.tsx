import { useRouterState } from "@tanstack/react-router";
import { MotionConfig, motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

import { SiteHeader } from "./site-header";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const reducedMotion = useReducedMotion();

  return (
    <MotionConfig reducedMotion="user" transition={{ duration: reducedMotion ? 0 : 0.24 }}>
      <a
        href="#page-content"
        className="bg-card text-primary sr-only z-50 rounded-full px-5 py-3 focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <SiteHeader />
      <motion.div
        id="page-content"
        key={pathname}
        tabIndex={-1}
        className="outline-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {children}
      </motion.div>
    </MotionConfig>
  );
}
