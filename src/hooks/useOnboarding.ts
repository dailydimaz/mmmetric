import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useOnboarding() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: hasCompleted, isLoading } = useQuery({
    queryKey: ["onboarding", user?.id],
    queryFn: async () => {
      if (!user) return true; // Default to completed if no user
      const { data, error } = await supabase
        .from("profiles")
        .select("has_completed_onboarding")
        .eq("id", user.id)
        .single();

      if (error) {
        // If no profile exists yet, onboarding is not completed
        if (error.code === "PGRST116") return false;
        throw error;
      }
      return data?.has_completed_onboarding ?? false;
    },
    enabled: !!user,
  });

  const completeOnboarding = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          has_completed_onboarding: true,
          email: user.email,
        }, { onConflict: "id" });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.setQueryData(["onboarding", user?.id], true);
    },
  });

  return {
    showOnboarding: !isLoading && hasCompleted === false,
    isLoading,
    completeOnboarding,
  };
}
