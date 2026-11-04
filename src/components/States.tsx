import type { ReactNode } from "react";
import { AlertCircle, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { describeError } from "@/lib/github";

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { title, message } = describeError(error);
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-lg border border-destructive/40 bg-card p-8 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="max-w-md text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}

export function EmptyState({ title, message, icon }: { title: string; message?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center">
      <div className="text-muted-foreground">{icon ?? <Inbox className="h-8 w-8" />}</div>
      <h3 className="text-sm font-semibold">{title}</h3>
      {message && <p className="max-w-md text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}
