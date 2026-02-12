import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Video, Play, Trash2, Monitor, Smartphone, Tablet, Globe, Clock, FileText, AlertTriangle } from "lucide-react";
import { useSessionRecordings, useSessionRecordingPlayback, useDeleteSessionRecording, SessionRecording } from "@/hooks/useSessionRecordings";
import { SessionPlayer } from "./SessionPlayer";
import { isSelfHosted } from "@/lib/billing";
import { formatDistanceToNow } from "date-fns";

interface SessionRecordingsListProps {
  siteId: string;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DeviceIcon({ type }: { type: string | null }) {
  if (type === 'mobile') return <Smartphone className="h-4 w-4" />;
  if (type === 'tablet') return <Tablet className="h-4 w-4" />;
  return <Monitor className="h-4 w-4" />;
}

export function SessionRecordingsList({ siteId }: SessionRecordingsListProps) {
  const { data: recordings, isLoading } = useSessionRecordings(siteId);
  const playbackMutation = useSessionRecordingPlayback();
  const deleteMutation = useDeleteSessionRecording();
  const [selectedRecording, setSelectedRecording] = useState<SessionRecording | null>(null);
  const [playbackData, setPlaybackData] = useState<any>(null);
  const [playerOpen, setPlayerOpen] = useState(false);

  if (!isSelfHosted()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Session Recordings
          </CardTitle>
          <CardDescription>
            Session recordings are available for self-hosted instances only.
            Configure your R3-compatible bucket to enable this feature.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 p-4 rounded-lg bg-muted/50 text-muted-foreground">
            <AlertTriangle className="h-5 w-5" />
            <p className="text-sm">
              This feature requires a self-hosted deployment with R3/S3-compatible storage configured via environment variables:
              <code className="ml-1 text-xs bg-muted px-1 py-0.5 rounded">R3_ENDPOINT</code>,
              <code className="ml-1 text-xs bg-muted px-1 py-0.5 rounded">R3_ACCESS_KEY</code>,
              <code className="ml-1 text-xs bg-muted px-1 py-0.5 rounded">R3_SECRET_KEY</code>,
              <code className="ml-1 text-xs bg-muted px-1 py-0.5 rounded">R3_BUCKET</code>
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handlePlay = async (recording: SessionRecording) => {
    setSelectedRecording(recording);
    try {
      const data = await playbackMutation.mutateAsync(recording.id);
      setPlaybackData(data);
      setPlayerOpen(true);
    } catch (e) {
      console.error('Playback failed:', e);
    }
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Session Recordings
          </CardTitle>
          <CardDescription>
            Video replays of user sessions and interactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !recordings?.length ? (
            <div className="text-center py-12 text-muted-foreground">
              <Video className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No recordings yet</p>
              <p className="text-sm mt-1">
                Recordings will appear once visitors interact with your site using the full tracking script.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Session</TableHead>
                  <TableHead>Pages</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>When</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recordings.map((rec) => (
                  <TableRow key={rec.id}>
                    <TableCell className="font-mono text-xs">
                      {rec.visitor_id.slice(0, 8)}…
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <FileText className="h-3 w-3 text-muted-foreground" />
                        <span>{rec.page_count}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span>{formatDuration(rec.duration_seconds)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DeviceIcon type={rec.device_type} />
                        <span className="text-xs text-muted-foreground">{rec.browser || '—'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {rec.country ? (
                        <div className="flex items-center gap-1">
                          <Globe className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs">{rec.city ? `${rec.city}, ` : ''}{rec.country}</span>
                        </div>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatBytes(rec.recording_size_bytes)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(rec.started_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePlay(rec)}
                          disabled={playbackMutation.isPending}
                          title="Play recording"
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" title="Delete recording">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Recording</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete this session recording. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(rec.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={playerOpen} onOpenChange={setPlayerOpen}>
        <DialogContent className="max-w-5xl h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Session Replay
              {selectedRecording && (
                <Badge variant="secondary" className="ml-2">
                  {formatDuration(selectedRecording.duration_seconds)}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {playbackData ? (
              <SessionPlayer events={playbackData.events} />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Loading recording…
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
