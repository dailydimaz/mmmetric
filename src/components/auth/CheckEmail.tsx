import { useState } from "react";
import { Mail, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast"; // Assuming this is where it is, based on previous files

interface CheckEmailProps {
    email: string;
    onBack: () => void;
    onResend: () => void; // Optional if we want parent to handle or component to handle
}

export function CheckEmail({ email, onBack }: CheckEmailProps) {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleResendEmail = async () => {
        if (!email) return;

        setLoading(true);
        try {
            const redirectUrl = `${window.location.origin}/`;
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: email,
                options: {
                    emailRedirectTo: redirectUrl,
                },
            });

            if (error) throw error;

            toast({
                title: "Email resent",
                description: "Check your inbox for the verification link.",
            });
        } catch (error) {
            const err = error as Error;
            toast({
                title: "Error",
                description: err.message || "Failed to resend email",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="text-center animate-fade-in-up">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-6">
                <Mail className="h-8 w-8 text-primary" />
            </div>

            <h1 className="text-2xl font-bold tracking-tight">Check your email</h1>
            <p className="mt-2 text-muted-foreground">
                We've sent a verification link to
            </p>
            <p className="font-medium text-foreground mt-1">{email}</p>

            <div className="mt-8 p-4 rounded-lg bg-muted/50 text-left border border-border/50">
                <h3 className="font-medium text-sm mb-2">Didn't receive the email?</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Check your spam folder</li>
                    <li>• Make sure the email address is correct</li>
                    <li>• Wait a few minutes and try again</li>
                </ul>
            </div>

            <Button
                type="button"
                onClick={handleResendEmail}
                variant="outline"
                className="w-full mt-6"
                disabled={loading}
            >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Resend email
            </Button>

            <button
                type="button"
                onClick={onBack}
                className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground w-full transition-colors"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
            </button>
        </div>
    );
}
