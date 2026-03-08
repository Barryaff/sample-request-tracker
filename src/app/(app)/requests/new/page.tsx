import { RequestForm } from "@/components/request-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";

export default function NewRequestPage() {
  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          New Sample Request
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Fill in the details below to submit a new sample request
        </p>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <Plus className="size-4 text-primary" />
            <CardTitle>Request Details</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <RequestForm />
        </CardContent>
      </Card>
    </div>
  );
}
