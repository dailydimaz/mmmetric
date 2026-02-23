import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Annotation {
    id: string;
    site_id: string;
    user_id: string;
    title: string;
    description: string | null;
    category: string;
    color: string;
    annotation_date: string;
    created_at: string;
    updated_at: string;
}

export type CreateAnnotationInput = Omit<Annotation, "id" | "created_at" | "updated_at">;
export type UpdateAnnotationInput = Partial<CreateAnnotationInput> & { id: string; site_id: string };

export function useAnnotations(siteId: string) {
    return useQuery({
        queryKey: ["annotations", siteId],
        queryFn: async (): Promise<Annotation[]> => {
            const { data, error } = await supabase
                .from("annotations")
                .select("*")
                .eq("site_id", siteId)
                .order("annotation_date", { ascending: false });

            if (error) throw error;
            return data as Annotation[];
        },
        enabled: !!siteId,
    });
}

export function useCreateAnnotation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (annotation: CreateAnnotationInput) => {
            const { data, error } = await supabase
                .from("annotations")
                .insert(annotation)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["annotations", variables.site_id] });
        },
    });
}

export function useUpdateAnnotation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (annotation: UpdateAnnotationInput) => {
            const { id, site_id, ...updates } = annotation;
            const { data, error } = await supabase
                .from("annotations")
                .update(updates)
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            if (variables.site_id) {
                queryClient.invalidateQueries({ queryKey: ["annotations", variables.site_id] });
            }
        },
    });
}

export function useDeleteAnnotation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, siteId }: { id: string; siteId: string }) => {
            const { error } = await supabase
                .from("annotations")
                .delete()
                .eq("id", id);

            if (error) throw error;
            return { id, siteId };
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["annotations", variables.siteId] });
        },
    });
}
