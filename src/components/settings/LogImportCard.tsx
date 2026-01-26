import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Upload, FileText } from "lucide-react";

interface LogImportCardProps {
    siteId: string;
}

export function LogImportCard({ siteId }: LogImportCardProps) {
    const { toast } = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

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
                .from('log-imports') // Ensure this bucket exists
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            // 2. Create import record
            const { path } = uploadData;
            const { data: importRecord, error: dbError } = await supabase
                .from('log_imports')
                .insert({
                    site_id: siteId,
                    user_id: (await supabase.auth.getUser()).data.user?.id,
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
                body: { import_id: importRecord.id }
            });

            toast({ title: "Import started", description: "Your logs are being processed. This may take a while." });
            setFile(null);
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setUploading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Log Analytics</CardTitle>
                <CardDescription>Import server logs (Apache, Nginx, IIS) to visualize historical data.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label htmlFor="logFile">Log File (CSV, JSON, or Combined Log Format)</Label>
                    <Input id="logFile" type="file" onChange={handleFileChange} accept=".csv,.json,.log,.txt" />
                </div>
                <Button onClick={handleUpload} disabled={!file || uploading}>
                    {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                    Upload and Process
                </Button>
            </CardContent>
        </Card>
    );
}
