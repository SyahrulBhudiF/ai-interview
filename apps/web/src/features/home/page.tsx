import { GreetForm } from "./components/greet-form";
import { Health } from "./components/health";

export function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <Health />
      <GreetForm />
    </main>
  );
}
