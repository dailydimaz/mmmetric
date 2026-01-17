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

const signUpSchema = z.object({
    fullName: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

interface SignUpFormProps {
    onToggleMode: () => void;
    onSuccess: (email: string) => void;
}

export function SignUpForm({ onToggleMode, onSuccess }: SignUpFormProps) {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const form = useForm<z.infer<typeof signUpSchema>>({
        resolver: zodResolver(signUpSchema),
        defaultValues: {
            fullName: "",
            email: "",
            password: "",
        },
    });

    const onSubmit = async (values: z.infer<typeof signUpSchema>) => {
        setLoading(true);
        try {
            const redirectUrl = `${window.location.origin}/`;
            const { error } = await supabase.auth.signUp({
                email: values.email,
                password: values.password,
                options: {
                    emailRedirectTo: redirectUrl,
                    data: {
                        full_name: values.fullName,
                    },
                },
            });

            if (error) {
                if (error.message.includes("already registered")) {
                    toast({
                        title: "Account exists",
                        description: "This email is already registered. Please sign in instead.",
                        variant: "destructive",
                    });
                    onToggleMode(); // Switch to sign in
                } else {
                    throw error;
                }
            } else {
                toast({
                    title: "Account created!",
                    description: "Please check your email to verify your account.",
                });
                onSuccess(values.email);
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
                title="Create your account"
                description="Start tracking your analytics in minutes"
            />

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="John Doe" {...field} disabled={loading} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

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
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                    <Input type="password" placeholder="••••••••" {...field} disabled={loading} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create account
                    </Button>
                </form>
            </Form>

            <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <button
                    type="button"
                    onClick={onToggleMode}
                    className="text-primary hover:underline font-medium"
                >
                    Sign in
                </button>
            </p>
        </div>
    );
}
