import { ApiSuccessSchema, GreetResponseSchema } from "@ai-interview/shared";
import { useForm } from "@tanstack/react-form";
import { Schema } from "effect";
import { useState } from "react";

import { api } from "@/lib/eden";

export function useGreetForm() {
  const [message, setMessage] = useState<string | null>(null);

  const form = useForm({
    defaultValues: { name: "" },
    onSubmit: async ({ value }) => {
      const { data, error } = await api.greet.post(value);
      if (error || !data) {
        setMessage("Request was rejected by the API.");
        return;
      }
      const parsed = Schema.decodeUnknownSync(ApiSuccessSchema(GreetResponseSchema))(data);
      setMessage(parsed.data.message);
    },
  });

  return { form, message };
}
