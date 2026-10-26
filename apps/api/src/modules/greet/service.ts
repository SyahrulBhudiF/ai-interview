import type { GreetRequest, GreetResponse } from "@repo/shared";

export function greet(input: GreetRequest): GreetResponse {
  return { message: `Hello, ${input.name}!` };
}
