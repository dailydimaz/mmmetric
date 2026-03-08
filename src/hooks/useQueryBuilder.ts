import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface QueryConfig {
  metrics: string[];
  dimensions: string[];
  startDate: string;
  endDate: string;
  filters: Record<string, string>;
  orderBy?: string;
  orderDir?: 'asc' | 'desc';
  limit?: number;
}

export interface QueryResult {
  rows: Record<string, any>[];
  executionTime: number;
}

export const AVAILABLE_METRICS = [
  { value: 'pageviews', label: 'Pageviews', icon: 'eye' },
  { value: 'visitors', label: 'Unique Visitors', icon: 'users' },
  { value: 'sessions', label: 'Sessions', icon: 'activity' },
  { value: 'events', label: 'Total Events', icon: 'zap' },
  { value: 'bounce_rate', label: 'Bounce Rate', icon: 'trending-down' },
];

export const AVAILABLE_DIMENSIONS = [
  { value: 'date', label: 'Date', icon: 'calendar' },
  { value: 'hour', label: 'Hour', icon: 'clock' },
  { value: 'url', label: 'Page URL', icon: 'link' },
  { value: 'referrer', label: 'Referrer', icon: 'external-link' },
  { value: 'country', label: 'Country', icon: 'globe' },
  { value: 'city', label: 'City', icon: 'map-pin' },
  { value: 'browser', label: 'Browser', icon: 'compass' },
  { value: 'os', label: 'Operating System', icon: 'monitor' },
  { value: 'device_type', label: 'Device Type', icon: 'smartphone' },
  { value: 'event_name', label: 'Event Name', icon: 'tag' },
  { value: 'language', label: 'Language', icon: 'globe-2' },
];

export const VISUALIZATION_TYPES = [
  { value: 'line', label: 'Line Chart' },
  { value: 'bar', label: 'Bar Chart' },
  { value: 'area', label: 'Area Chart' },
  { value: 'pie', label: 'Pie Chart' },
  { value: 'table', label: 'Table' },
  { value: 'number', label: 'Single Number' },
  { value: 'scatter', label: 'Scatter Plot' },
  { value: 'gauge', label: 'Gauge' },
  { value: 'pivot', label: 'Pivot Table' },
  { value: 'waterfall', label: 'Waterfall' },
  { value: 'progress', label: 'Progress Bar' },
  { value: 'funnel_viz', label: 'Funnel' },
  { value: 'treemap', label: 'Treemap' },
  { value: 'combo', label: 'Combo (Line + Bar)' },
];

export function useQueryBuilder(siteId: string | undefined) {
  const [queryConfig, setQueryConfig] = useState<QueryConfig>({
    metrics: ['pageviews'],
    dimensions: ['date'],
    startDate: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    filters: {},
    limit: 100,
  });

  const [result, setResult] = useState<QueryResult | null>(null);
  const [visualizationType, setVisualizationType] = useState('line');

  const executeQuery = useMutation({
    mutationFn: async (config: QueryConfig) => {
      if (!siteId) throw new Error('No site selected');
      const start = performance.now();

      const { data, error } = await supabase.rpc('execute_analytics_query', {
        p_site_id: siteId,
        p_metrics: config.metrics,
        p_dimensions: config.dimensions,
        p_start_date: config.startDate,
        p_end_date: config.endDate + 'T23:59:59Z',
        p_filters: config.filters,
        p_order_by: config.orderBy || null,
        p_order_dir: config.orderDir || 'desc',
        p_limit: config.limit || 100,
      } as any);

      if (error) throw error;
      const executionTime = Math.round(performance.now() - start);
      const rows = Array.isArray(data) ? data : (data || []);
      return { rows, executionTime };
    },
    onSuccess: (data) => setResult(data),
  });

  const runQuery = useCallback(() => {
    executeQuery.mutate(queryConfig);
  }, [queryConfig, executeQuery]);

  const updateConfig = useCallback((updates: Partial<QueryConfig>) => {
    setQueryConfig(prev => ({ ...prev, ...updates }));
  }, []);

  return {
    queryConfig,
    updateConfig,
    setQueryConfig,
    result,
    visualizationType,
    setVisualizationType,
    runQuery,
    isLoading: executeQuery.isPending,
    error: executeQuery.error,
  };
}
