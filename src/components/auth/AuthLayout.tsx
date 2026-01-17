import { Link } from "react-router-dom";
import mmmetricLogo from "@/assets/mmmetric-logo.png";
import { CheckCircle } from "lucide-react";

interface AuthLayoutProps {
    children: React.ReactNode;
    mode?: "signin" | "signup" | "forgot-password" | "check-email" | "mfa";
}

export function AuthLayout({ children, mode = "signin" }: AuthLayoutProps) {
    return (
        <div className="min-h-screen flex">
            {/* Left side - Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-background">
                <div className="w-full max-w-sm animate-fade-in-up">
                    <Link to="/" className="flex items-center gap-2 mb-8 w-fit hover:opacity-80 transition-opacity">
                        <img src={mmmetricLogo} alt="mmmetric" className="h-8 w-8 rounded-lg" />
                        <span className="font-display text-xl font-bold tracking-tight">mmmetric</span>
                    </Link>

                    {children}
                </div>
            </div>

            {/* Right side - Visuals */}
            <div className="hidden lg:flex flex-1 bg-muted/30 items-center justify-center p-12 relative overflow-hidden border-l border-border/50">
                <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03]" />

                {/* Decorative elements */}
                <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-20 animate-blob" />
                <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl opacity-20 animate-blob animation-delay-2000" />

                <div className="max-w-md text-center relative z-10 glass-panel p-8 rounded-2xl border border-white/10 shadow-xl bg-white/5 backdrop-blur-sm">
                    {mode === "check-email" ? (
                        <div className="flex flex-col items-center">
                            <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-6 ring-4 ring-primary/5">
                                <CheckCircle className="h-10 w-10" />
                            </div>
                            <h2 className="text-2xl font-bold tracking-tight">Almost there!</h2>
                            <p className="mt-4 text-muted-foreground leading-relaxed">
                                Click the link in your email to verify your account and start tracking your analytics.
                            </p>
                        </div>
                    ) : (
                        <>
                            <img src={mmmetricLogo} alt="mmmetric" className="inline-flex h-24 w-24 rounded-2xl mb-8 shadow-2xl rotate-3 hover:rotate-6 transition-transform duration-500" />
                            <h2 className="text-3xl font-bold tracking-tight mb-2">Privacy-first analytics</h2>
                            <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
                                Get powerful insights without compromising your users' privacy.
                                GDPR compliant, no cookies required.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-8 border-t border-border/10">
                                <div className="flex-1 text-center sm:text-left">
                                    <div className="text-3xl font-bold text-foreground">10K+</div>
                                    <div className="text-sm font-medium text-muted-foreground mt-1">Websites tracked</div>
                                </div>
                                <div className="hidden sm:block w-px bg-border/20 h-14"></div>
                                <div className="flex-1 text-center sm:text-left">
                                    <div className="text-3xl font-bold text-foreground">1M+</div>
                                    <div className="text-sm font-medium text-muted-foreground mt-1">Daily events</div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
