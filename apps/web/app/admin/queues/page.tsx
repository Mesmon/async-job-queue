import { Layout } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";

export default function QueuesDashboardPage() {
  return (
    <div className="w-full max-w-6xl px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Queue Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Monitor and manage background image processing jobs in real-time.
        </p>
      </div>

      <Card className="border-primary/10 shadow-lg h-[800px] flex flex-col">
        <CardHeader className="flex flex-row items-center gap-2 py-4">
          <Layout className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">BullMQ Board</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow p-0 overflow-hidden rounded-b-lg border-t">
          <iframe
            src="/api/queues"
            className="w-full h-full border-none"
            title="BullMQ Dashboard"
          />
        </CardContent>
      </Card>
    </div>
  );
}
