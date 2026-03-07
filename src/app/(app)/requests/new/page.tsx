import { RequestForm } from "@/components/request-form";

export default function NewRequestPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">
        New Sample Request
      </h1>
      <RequestForm />
    </div>
  );
}
