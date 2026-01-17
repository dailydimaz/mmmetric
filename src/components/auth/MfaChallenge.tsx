import { useState } from "react";
import { Shield, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSeparator,
    InputOTPSlot,
} from "@/components/ui/input-otp";

interface MfaChallengeProps {
    factorId: string;
    onCancel: () => void;
}

export function MfaChallenge({ factorId, onCancel }: MfaChallengeProps) {
    const [loading, setLoading] = useState(false);
    const [code, setCode] = useState("");
    const { toast } = useToast();
    const navigate = useNavigate();

    const handleVerify = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!factorId || code.length !== 6) return;

        setLoading(true);
        try {
            const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
                factorId: factorId,
            });

            if (challengeError) throw challengeError;

            const { error: verifyError } = await supabase.auth.mfa.verify({
                factorId: factorId,
                challengeId: challengeData.id,
                code: code,
            });

            if (verifyError) throw verifyError;

            toast({
                title: "Verified",
                description: "Two-factor authentication successful",
            });

            navigate("/dashboard");
        } catch (error) {
            const err = error as Error;
            toast({
                title: "Verification failed",
                description: err.message || "Invalid code. Please try again.",
                variant: "destructive",
            });
            setCode("");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Two-Factor Auth</h1>
                    <p className="text-muted-foreground text-sm">
                        Enter the code from your app
                    </p>
                </div>
            </div>

            <form onSubmit={handleVerify} className="space-y-6">
                <div className="flex justify-center">
                    <InputOTP maxLength={6} value={code} onChange={setCode}>
                        <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                        </InputOTPGroup>
                        <InputOTPSeparator />
                        <InputOTPGroup>
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                        </InputOTPGroup>
                    </InputOTP>
                </div>

                <Button
                    type="submit"
                    className="w-full"
                    disabled={loading || code.length !== 6}
                >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Verify
                </Button>
            </form>

            <button
                type="button"
                onClick={onCancel}
                className="text-center text-sm text-muted-foreground hover:text-foreground w-full transition-colors"
            >
                Cancel and sign out
            </button>
        </div>
    );
}
