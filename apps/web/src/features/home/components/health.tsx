import { Badge } from "@ai-interview/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@ai-interview/ui/card";
import { Skeleton } from "@ai-interview/ui/skeleton";

import { useHealth } from "../hooks/use-health";

export function Health() {
  const { status, isPending } = useHealth();

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>API health</CardTitle>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <Skeleton className="h-5 w-48" />
        ) : (
          <Badge variant="secondary">{status}</Badge>
        )}
      </CardContent>
    </Card>
  );
}
