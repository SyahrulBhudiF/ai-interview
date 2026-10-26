import { Badge } from "@repo/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/components/card";
import { Skeleton } from "@repo/components/skeleton";

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
