import { Button } from "@ai-interview/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ai-interview/ui/card";
import { Input } from "@ai-interview/ui/input";
import { Label } from "@ai-interview/ui/label";

import { useGreetForm } from "../hooks/use-greet-form";

export function GreetForm() {
  const { form, message } = useGreetForm();

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Greet the API</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <form.Field
            name="name"
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Your name</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Ada Lovelace"
                />
              </div>
            )}
          />
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <Button type="submit" disabled={!canSubmit || isSubmitting}>
                {isSubmitting ? "Sending…" : "Send"}
              </Button>
            )}
          />
        </form>
        {message ? <p className="text-muted-foreground text-sm">{message}</p> : null}
      </CardContent>
    </Card>
  );
}
