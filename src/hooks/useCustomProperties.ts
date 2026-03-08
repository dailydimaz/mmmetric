import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getDateRangeFilter, DateRange } from "./useAnalytics";

export interface PropertyKey {
  key: string;
  occurrences: number;
}

export interface PropertyValue {
  value: string;
  count: number;
  unique_visitors: number;
}

export function useCustomPropertyKeys(siteId: string, dateRange: DateRange, eventName?: string) {
  const { start, end } = getDateRangeFilter(dateRange);

  return useQuery({
    queryKey: ["custom-property-keys", siteId, dateRange, eventName],
    queryFn: async (): Promise<PropertyKey[]> => {
      const { data, error } = await supabase.rpc("get_custom_properties_breakdown" as any, {
        _site_id: siteId,
        _start_date: start.toISOString(),
        _end_date: end.toISOString(),
        _event_name: eventName || null,
      });

      if (error) throw error;
      return (data || []) as PropertyKey[];
    },
    enabled: !!siteId,
  });
}

export function useCustomPropertyValues(
  siteId: string,
  dateRange: DateRange,
  propertyKey: string,
  eventName?: string
) {
  const { start, end } = getDateRangeFilter(dateRange);

  return useQuery({
    queryKey: ["custom-property-values", siteId, dateRange, propertyKey, eventName],
    queryFn: async (): Promise<PropertyValue[]> => {
      const { data, error } = await supabase.rpc("get_custom_properties_breakdown" as any, {
        _site_id: siteId,
        _start_date: start.toISOString(),
        _end_date: end.toISOString(),
        _event_name: eventName || null,
        _property_key: propertyKey,
      });

      if (error) throw error;
      return (data || []) as PropertyValue[];
    },
    enabled: !!siteId && !!propertyKey,
  });
}
