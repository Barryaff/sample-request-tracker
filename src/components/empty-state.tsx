import * as React from "react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  message: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, message, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 px-8 py-20 text-center">
      <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground/50 [&_svg]:size-7">
        {icon ?? <Inbox />}
      </div>
      <p className="text-base font-medium text-foreground/80">{message}</p>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
