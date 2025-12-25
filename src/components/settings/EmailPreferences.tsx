import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Bell, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface EmailPrefs {
  email_notifications: boolean;
  weekly_digest: boolean;
  marketing_emails: boolean;
}

export function EmailPreferences() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState<EmailPrefs>({
    email_notifications: true,
    weekly_digest: true,
    marketing_emails: false,
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [originalPrefs, setOriginalPrefs] = useState<EmailPrefs | null>(null);

  useEffect(() => {
    if (user) {
      fetchPreferences();
    }
  }, [user]);

  useEffect(() => {
    if (originalPrefs) {
      const changed = 
        prefs.email_notifications !== originalPrefs.email_notifications ||
        prefs.weekly_digest !== originalPrefs.weekly_digest ||
        prefs.marketing_emails !== originalPrefs.marketing_emails;
      setHasChanges(changed);
    }
  }, [prefs, originalPrefs]);

  const fetchPreferences = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("email_notifications, weekly_digest, marketing_emails")
        .eq("id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      
      if (data) {
        const fetchedPrefs = {
          email_notifications: data.email_notifications ?? true,
          weekly_digest: data.weekly_digest ?? true,
          marketing_emails: data.marketing_emails ?? false,
        };
        setPrefs(fetchedPrefs);
        setOriginalPrefs(fetchedPrefs);
      }
    } catch (error: any) {
      console.error("Error fetching email preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          email_notifications: prefs.email_notifications,
          weekly_digest: prefs.weekly_digest,
          marketing_emails: prefs.marketing_emails,
        })
        .eq("id", user.id);

      if (error) throw error;

      setOriginalPrefs(prefs);
      setHasChanges(false);
      toast({
        title: "Preferences saved",
        description: "Your email preferences have been updated",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save preferences",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updatePref = (key: keyof EmailPrefs, value: boolean) => {
    setPrefs(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Email Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Email Preferences
        </CardTitle>
        <CardDescription>
          Manage your email notification settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive important notifications about your account
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={prefs.email_notifications}
              onCheckedChange={(checked) => updatePref("email_notifications", checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="weekly-digest">Weekly Digest</Label>
              <p className="text-sm text-muted-foreground">
                Get a weekly summary of your analytics
              </p>
            </div>
            <Switch
              id="weekly-digest"
              checked={prefs.weekly_digest}
              onCheckedChange={(checked) => updatePref("weekly_digest", checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="marketing-emails">Marketing Emails</Label>
              <p className="text-sm text-muted-foreground">
                Receive tips, product updates, and special offers
              </p>
            </div>
            <Switch
              id="marketing-emails"
              checked={prefs.marketing_emails}
              onCheckedChange={(checked) => updatePref("marketing_emails", checked)}
            />
          </div>
        </div>

        {hasChanges && (
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Preferences
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
