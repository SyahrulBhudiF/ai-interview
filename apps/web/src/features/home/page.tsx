import { Link } from "@tanstack/react-router";

import { GreetForm } from "./components/greet-form";
import { Health } from "./components/health";

export function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <Link to="/interviews" className="text-sm underline underline-offset-4">
        Open interviews
      </Link>
      <Health />
      <GreetForm />
    </main>
  );
}
