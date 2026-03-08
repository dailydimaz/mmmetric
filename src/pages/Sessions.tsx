import { useState } from "react";
import { useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { SessionsList } from "@/components/sessions/SessionsList";
import { SessionDetailPanel } from "@/components/sessions/SessionDetailPanel";
import { useSessions } from "@/hooks/useSessions";
import { subDays } from "date-fns";

export default function Sessions() {
  const { siteId } = useParams<{ siteId: string }>();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [dateRange] = useState({ start: subDays(new Date(), 7), end: new Date() });

  const { sessions, total, page, setPage, isLoading } = useSessions(
    siteId,
    dateRange.start,
    dateRange.end
  );

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sessions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View individual visitor sessions and their activity
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={selectedSessionId ? "lg:col-span-1" : "lg:col-span-3"}>
            <SessionsList
              sessions={sessions}
              total={total}
              page={page}
              onPageChange={setPage}
              isLoading={isLoading}
              selectedSessionId={selectedSessionId}
              onSelectSession={setSelectedSessionId}
            />
          </div>

          {selectedSessionId && (
            <div className="lg:col-span-2">
              <SessionDetailPanel
                siteId={siteId!}
                sessionId={selectedSessionId}
                onClose={() => setSelectedSessionId(null)}
              />
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
