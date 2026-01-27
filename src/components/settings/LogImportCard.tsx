import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Upload, FileText, CheckCircle2, XCircle, Clock, RefreshCw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface LogImportCardProps {
    siteId: string;
}

type LogFormat = 'auto' | 'combined' | 'common' | 'iis' | 'csv';

interface LogImport {
    id: string;
    file_name: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    rows_processed: number;
    rows_failed: number;
    error_message: string | null;
    created_at: string;
    completed_at: string | null;
}

export function LogImportCard({ siteId }: LogImportCardProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [file, setFile] = useState<File | null>(null);
    const [logFormat, setLogFormat] = useState<LogFormat>('auto');
    const [uploading, setUploading] = useState(false);

    const { data: imports, isLoading: importsLoading } = useQuery({
        queryKey: ['log-imports', siteId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('log_imports')
                .select('*')
                .eq('site_id', siteId)
                .order('created_at', { ascending: false })
                .limit(10);
            if (error) throw error;
            return data as LogImport[];
        },
        refetchInterval: (query) => {
            // Refetch every 5 seconds if there are pending/processing imports
            const data = query.state.data;
            if (data?.some(i => i.status === 'pending' || i.status === 'processing')) {
                return 5000;
            }
            return false;
        }
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        try {
            // 1. Upload file to storage
            const fileName = `${siteId}/${Date.now()}_${file.name}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('log-imports')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            // 2. Create import record
            const { path } = uploadData;
            const { data: user } = await supabase.auth.getUser();
            const { data: importRecord, error: dbError } = await supabase
                .from('log_imports')
                .insert({
                    site_id: siteId,
                    user_id: user.user?.id,
                    file_name: file.name,
                    file_url: path,
                    file_size: file.size,
                    status: 'pending'
                })
                .select()
                .single();

            if (dbError) throw dbError;

            // 3. Trigger processing function
            await supabase.functions.invoke('process-logs', {
                body: { import_id: importRecord.id, format: logFormat }
            });

            toast({ 
                title: "Import started", 
                description: "Your logs are being processed. This may take a while for large files." 
            });
            setFile(null);
            queryClient.invalidateQueries({ queryKey: ['log-imports', siteId] });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setUploading(false);
        }
    };

    const getStatusBadge = (status: LogImport['status']) => {
        switch (status) {
            case 'completed':
                return <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle2 className="h-3 w-3 mr-1" />Completed</Badge>;
            case 'failed':
                return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
            case 'processing':
                return <Badge variant="secondary"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Processing</Badge>;
            default:
                return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Log Analytics
                </CardTitle>
                <CardDescription>
                    Import server logs from Apache, Nginx, or IIS to visualize historical traffic data.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Upload Section */}
                <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="logFile">Log File</Label>
                            <Input 
                                id="logFile" 
                                type="file" 
                                onChange={handleFileChange} 
                                accept=".csv,.json,.log,.txt"
                                className="cursor-pointer"
                            />
                            <p className="text-xs text-muted-foreground">
                                Supports .log, .txt, .csv files up to 20MB
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="logFormat">Log Format</Label>
                            <Select value={logFormat} onValueChange={(v) => setLogFormat(v as LogFormat)}>
                                <SelectTrigger id="logFormat">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="auto">Auto-detect</SelectItem>
                                    <SelectItem value="combined">Apache/Nginx Combined</SelectItem>
                                    <SelectItem value="common">Apache/Nginx Common</SelectItem>
                                    <SelectItem value="iis">IIS (W3C Extended)</SelectItem>
                                    <SelectItem value="csv">CSV</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Auto-detect works for most standard formats
                            </p>
                        </div>
                    </div>
                    <Button onClick={handleUpload} disabled={!file || uploading} className="w-full sm:w-auto">
                        {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                        Upload and Process
                    </Button>
                </div>

                {/* Import History */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">Recent Imports</h4>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => queryClient.invalidateQueries({ queryKey: ['log-imports', siteId] })}
                        >
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </div>
                    
                    {importsLoading ? (
                        <div className="flex justify-center py-4">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : imports && imports.length > 0 ? (
                        <div className="space-y-2">
                            {imports.map((imp) => (
                                <div 
                                    key={imp.id} 
                                    className="flex items-center justify-between p-3 rounded-md border bg-card text-sm"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{imp.file_name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {format(new Date(imp.created_at), 'MMM d, yyyy h:mm a')}
                                            {imp.status === 'completed' && (
                                                <span className="ml-2">
                                                    • {imp.rows_processed.toLocaleString()} rows imported
                                                    {imp.rows_failed > 0 && `, ${imp.rows_failed.toLocaleString()} failed`}
                                                </span>
                                            )}
                                        </p>
                                        {imp.error_message && (
                                            <p className="text-xs text-destructive mt-1">{imp.error_message}</p>
                                        )}
                                    </div>
                                    <div className="ml-4">
                                        {getStatusBadge(imp.status)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            No imports yet. Upload a log file to get started.
                        </p>
                    )}
                </div>

                {/* Format Help */}
                <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
                    <p className="font-medium">Supported formats:</p>
                    <ul className="list-disc list-inside space-y-0.5 ml-2">
                        <li><strong>Apache/Nginx Combined:</strong> Standard access.log format with referrer and user agent</li>
                        <li><strong>Apache/Nginx Common:</strong> Basic format without referrer/user agent</li>
                        <li><strong>IIS W3C Extended:</strong> Windows IIS server logs</li>
                        <li><strong>CSV:</strong> Custom CSV with timestamp, url columns</li>
                    </ul>
                </div>
            </CardContent>
        </Card>
    );
}
