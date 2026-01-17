import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { SignInForm } from "@/components/auth/SignInForm";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { CheckEmail } from "@/components/auth/CheckEmail";
import { MfaChallenge } from "@/components/auth/MfaChallenge";

type AuthMode = "signin" | "signup" | "forgot-password" | "check-email";

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<AuthMode>(
    searchParams.get("mode") === "signup" ? "signup" : "signin"
  );

  // State for email verification / reset pass flow
  const [emailSentTo, setEmailSentTo] = useState("");

  // MFA state
  const [showMfaChallenge, setShowMfaChallenge] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        checkMfaRequired(session);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && !showMfaChallenge) {
        checkMfaRequired(session);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, showMfaChallenge]);

  const checkMfaRequired = async (session: { user: { id: string } }) => {
    const { data: factorsData } = await supabase.auth.mfa.listFactors();
    const verifiedFactors = factorsData?.totp?.filter(f => f.status === 'verified') || [];

    if (verifiedFactors.length > 0) {
      const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

      if (aalData?.currentLevel === 'aal1' && aalData?.nextLevel === 'aal2') {
        setMfaFactorId(verifiedFactors[0].id);
        setShowMfaChallenge(true);
        return;
      }
    }

    // Check for pending invite token and redirect there
    const pendingInviteToken = sessionStorage.getItem("pendingInviteToken");
    if (pendingInviteToken) {
      sessionStorage.removeItem("pendingInviteToken");
      navigate(`/invite/${pendingInviteToken}`);
      return;
    }

    navigate("/dashboard");
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setShowMfaChallenge(false);
    setMfaFactorId(null);
    setMode("signin");
  };

  // Determine which component to render
  const renderContent = () => {
    if (showMfaChallenge && mfaFactorId) {
      return (
        <MfaChallenge
          factorId={mfaFactorId}
          onCancel={handleSignOut}
        />
      );
    }

    switch (mode) {
      case "signin":
        return (
          <SignInForm
            onToggleMode={() => setMode("signup")}
            onForgotPassword={() => setMode("forgot-password")}
            onSuccess={(session) => checkMfaRequired(session)}
          />
        );
      case "signup":
        return (
          <SignUpForm
            onToggleMode={() => setMode("signin")}
            onSuccess={(email) => {
              setEmailSentTo(email);
              setMode("check-email");
            }}
          />
        );
      case "forgot-password":
        return (
          <ForgotPasswordForm
            onBack={() => setMode("signin")}
            onSuccess={(email) => {
              setEmailSentTo(email);
              setMode("check-email");
            }}
          />
        );
      case "check-email":
        return (
          <CheckEmail
            email={emailSentTo}
            onBack={() => {
              setMode("signin");
              setEmailSentTo("");
            }}
            onResend={() => { }} // Optional: logic moved inside component or we can pass here
          />
        );
      default:
        return null;
    }
  };

  return (
    <AuthLayout mode={showMfaChallenge ? "mfa" : mode}>
      {renderContent()}
    </AuthLayout>
  );
}
