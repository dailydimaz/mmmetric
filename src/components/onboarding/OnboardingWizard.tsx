import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSites } from "@/hooks/useSites";
import { useOnboarding } from "@/hooks/useOnboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BarChart3,
  Globe,
  Layout,
  Code2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Copy,
  Check,
  Sparkles,
  Shield,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const STEPS = ["welcome", "create-site", "install-script", "complete"] as const;
type Step = (typeof STEPS)[number];

export function OnboardingWizard() {
  const [step, setStep] = useState<Step>("welcome");
  const [siteName, setSiteName] = useState("");
  const [siteDomain, setSiteDomain] = useState("");
  const [createdSite, setCreatedSite] = useState<{ id: string; tracking_id: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const { createSite } = useSites();
  const { completeOnboarding } = useOnboarding();
  const navigate = useNavigate();

  const currentIndex = STEPS.indexOf(step);
  const progress = ((currentIndex + 1) / STEPS.length) * 100;

  const handleCreateSite = async () => {
    try {
      const site = await createSite.mutateAsync({ name: siteName, domain: siteDomain || undefined });
      setCreatedSite({ id: site.id, tracking_id: site.tracking_id });
      setStep("install-script");
    } catch {
      // Error handled by mutation toast
    }
  };

  const handleCopyScript = () => {
    if (!createdSite) return;
    const script = `<script defer src="${window.location.origin}/track.js" data-site="${createdSite.tracking_id}" data-api="${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track"></script>`;
    navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFinish = async () => {
    await completeOnboarding.mutateAsync();
    if (createdSite) {
      navigate(`/dashboard/sites/${createdSite.id}`);
    }
  };

  const handleSkip = async () => {
    await completeOnboarding.mutateAsync();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xl"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <motion.div
        layout
        className="relative w-full max-w-xl mx-4 bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          />
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 pt-6 pb-2">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all duration-300 ${
                i <= currentIndex
                  ? "w-8 bg-primary"
                  : "w-2 bg-muted-foreground/20"
              }`}
            />
          ))}
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {step === "welcome" && (
              <StepContainer key="welcome">
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <BarChart3 className="h-10 w-10 text-primary" />
                    </div>
                    <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                      <Sparkles className="h-3 w-3 text-primary-foreground" />
                    </div>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-center mb-2">
                  Welcome to mmmetric
                </h2>
                <p className="text-muted-foreground text-center mb-8 text-lg">
                  Privacy-first analytics for your websites. Let's get you set up in under 2 minutes.
                </p>

                <div className="grid grid-cols-3 gap-4 mb-8">
                  {[
                    { icon: Shield, label: "No cookies", desc: "GDPR ready" },
                    { icon: Zap, label: "< 1KB script", desc: "Zero impact" },
                    { icon: BarChart3, label: "Real-time", desc: "Live data" },
                  ].map(({ icon: Icon, label, desc }) => (
                    <div
                      key={label}
                      className="flex flex-col items-center p-3 rounded-xl bg-muted/50 border border-border/40"
                    >
                      <Icon className="h-5 w-5 text-primary mb-2" />
                      <span className="text-xs font-semibold">{label}</span>
                      <span className="text-[10px] text-muted-foreground">{desc}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-3">
                  <Button size="lg" className="w-full gap-2" onClick={() => setStep("create-site")}>
                    Get started
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                    onClick={handleSkip}
                    disabled={completeOnboarding.isPending}
                  >
                    Skip for now
                  </Button>
                </div>
              </StepContainer>
            )}

            {step === "create-site" && (
              <StepContainer key="create-site">
                <div className="flex justify-center mb-6">
                  <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Globe className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h2 className="text-xl font-bold text-center mb-1">Add your first site</h2>
                <p className="text-muted-foreground text-center mb-6">
                  Enter your website details to start tracking analytics.
                </p>

                <div className="space-y-4 mb-8">
                  <div className="space-y-2">
                    <Label htmlFor="onb-name">Site name</Label>
                    <div className="relative">
                      <Input
                        id="onb-name"
                        placeholder="My Website"
                        value={siteName}
                        onChange={(e) => setSiteName(e.target.value)}
                        className="pl-9"
                      />
                      <Layout className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/50" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="onb-domain">Domain (optional)</Label>
                    <div className="relative">
                      <Input
                        id="onb-domain"
                        placeholder="example.com"
                        value={siteDomain}
                        onChange={(e) => setSiteDomain(e.target.value)}
                        className="pl-9"
                      />
                      <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/50" />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep("welcome")} className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    className="flex-1 gap-2"
                    disabled={!siteName || createSite.isPending}
                    onClick={handleCreateSite}
                  >
                    {createSite.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowRight className="h-4 w-4" />
                    )}
                    Create & continue
                  </Button>
                </div>
              </StepContainer>
            )}

            {step === "install-script" && createdSite && (
              <StepContainer key="install-script">
                <div className="flex justify-center mb-6">
                  <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Code2 className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h2 className="text-xl font-bold text-center mb-1">Install tracking script</h2>
                <p className="text-muted-foreground text-center mb-6">
                  Add this snippet to your website's <code className="text-xs bg-muted px-1.5 py-0.5 rounded">&lt;head&gt;</code> tag.
                </p>

                <div className="relative mb-6">
                  <pre className="bg-muted/60 border border-border/40 rounded-xl p-4 text-xs overflow-x-auto leading-relaxed">
                    <code className="text-foreground/80">
{`<script defer
  src="${window.location.origin}/track.js"
  data-site="${createdSite.tracking_id}"
  data-api="${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track">
</script>`}
                    </code>
                  </pre>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute top-2 right-2 gap-1.5 h-7 text-xs"
                    onClick={handleCopyScript}
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground text-center mb-6">
                  Don't worry — you can always find this in your site settings later.
                </p>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep("create-site")} className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                  <Button className="flex-1 gap-2" onClick={() => setStep("complete")}>
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </StepContainer>
            )}

            {step === "complete" && (
              <StepContainer key="complete">
                <div className="flex justify-center mb-6">
                  <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle2 className="h-10 w-10 text-primary" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-center mb-2">You're all set! 🎉</h2>
                <p className="text-muted-foreground text-center mb-8 text-lg">
                  Your site is ready. Data will appear in your dashboard as visitors arrive.
                </p>

                <div className="bg-muted/40 border border-border/40 rounded-xl p-4 mb-8">
                  <h4 className="font-medium text-sm mb-3">What's next?</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      Verify your tracking script is installed correctly
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      Set up custom events for key user actions
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      Create your first conversion funnel
                    </li>
                  </ul>
                </div>

                <Button
                  size="lg"
                  className="w-full gap-2"
                  onClick={handleFinish}
                  disabled={completeOnboarding.isPending}
                >
                  {completeOnboarding.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Go to Dashboard
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </StepContainer>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

function StepContainer({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
    >
      {children}
    </motion.div>
  );
}
