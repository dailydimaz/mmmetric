import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { AuthHeader } from "./AuthHeader";

const signInSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

interface SignInFormProps {
    onToggleMode: () => void;
    onForgotPassword: () => void;
    onSuccess: (session: any) => void;
}

export function SignInForm({ onToggleMode, onForgotPassword, onSuccess }: SignInFormProps) {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const form = useForm<z.infer<typeof signInSchema>>({
        resolver: zodResolver(signInSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const trackLogin = async (success: boolean) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const ua = navigator.userAgent;
            let browser = "Unknown";
            let os = "Unknown";
            let deviceType = "desktop";

            if (ua.includes("Firefox")) browser = "Firefox";
            else if (ua.includes("Chrome") && !ua.includes("Edg")) browser = "Chrome";
            else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
            else if (ua.includes("Edg")) browser = "Edge";

            if (ua.includes("Windows")) os = "Windows";
            else if (ua.includes("Mac OS")) os = "macOS";
            else if (ua.includes("Linux")) os = "Linux";
            else if (ua.includes("Android")) os = "Android";
            else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

            if (ua.includes("Mobile")) deviceType = "mobile";
            else if (ua.includes("Tablet") || ua.includes("iPad")) deviceType = "tablet";

            await supabase.from("login_history").insert({
                user_id: user.id,
                user_agent: ua,
                browser,
                os,
                device_type: deviceType,
                success,
            });
        } catch (e) {
            console.error("Failed to track login:", e);
        }
    };

    const onSubmit = async (values: z.infer<typeof signInSchema>) => {
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: values.email,
                password: values.password,
            });

            if (error) {
                await trackLogin(false);
                if (error.message.includes("Invalid login credentials")) {
                    toast({
                        title: "Invalid credentials",
                        description: "Please check your email and password and try again.",
                        variant: "destructive",
                    });
                } else if (error.message.includes("Email not confirmed")) {
                    toast({
                        title: "Email not verified",
                        description: "Please check your email and click the verification link.",
                        variant: "destructive",
                    });
                } else {
                    throw error;
                }
            } else if (data.session) {
                await trackLogin(true);
                onSuccess(data.session);
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "An unexpected error occurred",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <AuthHeader
                title="Welcome back"
                description="Sign in to access your dashboard"
            />

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input placeholder="you@example.com" {...field} disabled={loading} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <div className="flex items-center justify-between">
                                    <FormLabel>Password</FormLabel>
                                    <button
                                        type="button"
                                        onClick={onForgotPassword}
                                        className="text-xs text-primary hover:underline font-medium"
                                        tabIndex={-1}
                                    >
                                        Forgot password?
                                    </button>
                                </div>
                                <FormControl>
                                    <Input type="password" placeholder="••••••••" {...field} disabled={loading} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Sign In
                    </Button>
                </form>
            </Form>

            <p className="text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <button
                    type="button"
                    onClick={onToggleMode}
                    className="text-primary hover:underline font-medium"
                >
                    Sign up
                </button>
            </p>
        </div>
    );
}
