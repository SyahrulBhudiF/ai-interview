import type { GreetRequest, GreetResponse } from "@ai-interview/shared";

export function greet(input: GreetRequest): GreetResponse {
  return { message: `Hello, ${input.name}!` };
}
