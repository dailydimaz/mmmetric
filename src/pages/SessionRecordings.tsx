import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { SessionRecordingsList } from "@/components/analytics/SessionRecordingsList";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function SessionRecordings() {
  const { siteId } = useParams();
  const navigate = useNavigate();

  if (!siteId) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/dashboard/sites/${siteId}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Session Recordings</h1>
        </div>
        <SessionRecordingsList siteId={siteId} />
      </div>
    </DashboardLayout>
  );
}
