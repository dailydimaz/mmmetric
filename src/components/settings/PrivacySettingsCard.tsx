import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, Plus, X, Save, Loader2 } from "lucide-react";

interface PrivacySettingsCardProps {
  siteId: string;
  excludedIps: string[];
  excludedUrlParams: string[];
  requireConsent: boolean;
  onUpdate: () => void;
}

export function PrivacySettingsCard({
  siteId,
  excludedIps,
  excludedUrlParams,
  requireConsent,
  onUpdate,
}: PrivacySettingsCardProps) {
  const [ips, setIps] = useState<string[]>(excludedIps || []);
  const [params, setParams] = useState<string[]>(excludedUrlParams || []);
  const [consent, setConsent] = useState(requireConsent);
  const [newIp, setNewIp] = useState("");
  const [newParam, setNewParam] = useState("");
  const [saving, setSaving] = useState(false);

  const addIp = () => {
    const trimmed = newIp.trim();
    if (trimmed && !ips.includes(trimmed)) {
      setIps([...ips, trimmed]);
      setNewIp("");
    }
  };

  const addParam = () => {
    const trimmed = newParam.trim();
    if (trimmed && !params.includes(trimmed)) {
      setParams([...params, trimmed]);
      setNewParam("");
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("sites")
        .update({
          excluded_ips: ips,
          excluded_url_params: params,
          require_consent: consent,
        } as any)
        .eq("id", siteId);

      if (error) throw error;
      toast.success("Privacy settings saved");
      onUpdate();
    } catch (e: any) {
      toast.error("Failed to save: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" /> Privacy & Exclusions
        </CardTitle>
        <CardDescription>Configure IP exclusions, URL parameter stripping, and consent requirements</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* IP Exclusion */}
        <div className="space-y-2">
          <Label>Excluded IP Addresses</Label>
          <p className="text-xs text-muted-foreground">Traffic from these IPs will not be tracked. Supports individual IPs and CIDR ranges.</p>
          <div className="flex gap-2">
            <Input
              placeholder="e.g. 192.168.1.0/24"
              value={newIp}
              onChange={(e) => setNewIp(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addIp()}
            />
            <Button size="sm" variant="outline" onClick={addIp}><Plus className="h-4 w-4" /></Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ips.map((ip) => (
              <Badge key={ip} variant="secondary" className="gap-1">
                {ip}
                <button onClick={() => setIps(ips.filter((i) => i !== ip))} className="hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>

        {/* URL Parameter Exclusion */}
        <div className="space-y-2">
          <Label>Excluded URL Parameters</Label>
          <p className="text-xs text-muted-foreground">These query parameters will be stripped from tracked URLs (e.g. fbclid, gclid, session tokens).</p>
          <div className="flex gap-2">
            <Input
              placeholder="e.g. fbclid"
              value={newParam}
              onChange={(e) => setNewParam(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addParam()}
            />
            <Button size="sm" variant="outline" onClick={addParam}><Plus className="h-4 w-4" /></Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {params.map((p) => (
              <Badge key={p} variant="secondary" className="gap-1">
                {p}
                <button onClick={() => setParams(params.filter((x) => x !== p))} className="hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>

        {/* Consent Mode */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <Label>Require Consent</Label>
            <p className="text-xs text-muted-foreground mt-0.5">When enabled, tracking only starts after visitor gives consent via <code className="text-xs">mmmetric.consent()</code></p>
          </div>
          <Switch checked={consent} onCheckedChange={setConsent} />
        </div>

        <Button onClick={save} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Privacy Settings
        </Button>
      </CardContent>
    </Card>
  );
}
