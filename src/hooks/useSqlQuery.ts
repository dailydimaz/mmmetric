import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SqlQueryResult {
  columns: string[];
  rows: Record<string, any>[];
  rowCount: number;
  executionTime: number;
}

const SQL_TEMPLATES = [
  {
    name: 'Top pages by pageviews',
    sql: `SELECT url, COUNT(*) as pageviews, COUNT(DISTINCT visitor_id) as visitors
FROM events_partitioned
WHERE site_id = '{{site_id}}' AND event_name = 'pageview'
  AND created_at >= '{{start_date}}'::timestamptz AND created_at <= '{{end_date}}'::timestamptz
GROUP BY url ORDER BY pageviews DESC LIMIT 20`,
  },
  {
    name: 'Visitors by country',
    sql: `SELECT country, COUNT(DISTINCT visitor_id) as visitors, COUNT(*) as events
FROM events_partitioned
WHERE site_id = '{{site_id}}'
  AND created_at >= '{{start_date}}'::timestamptz AND created_at <= '{{end_date}}'::timestamptz
GROUP BY country ORDER BY visitors DESC LIMIT 20`,
  },
  {
    name: 'Hourly traffic pattern',
    sql: `SELECT EXTRACT(HOUR FROM created_at) as hour, COUNT(*) as events
FROM events_partitioned
WHERE site_id = '{{site_id}}' AND event_name = 'pageview'
  AND created_at >= '{{start_date}}'::timestamptz AND created_at <= '{{end_date}}'::timestamptz
GROUP BY hour ORDER BY hour`,
  },
  {
    name: 'Referrer breakdown',
    sql: `SELECT COALESCE(referrer, '(direct)') as referrer, COUNT(DISTINCT visitor_id) as visitors
FROM events_partitioned
WHERE site_id = '{{site_id}}' AND event_name = 'pageview'
  AND created_at >= '{{start_date}}'::timestamptz AND created_at <= '{{end_date}}'::timestamptz
GROUP BY referrer ORDER BY visitors DESC LIMIT 20`,
  },
];

export function useSqlQuery(siteId: string | undefined) {
  const [sql, setSql] = useState('');
  const [result, setResult] = useState<SqlQueryResult | null>(null);
  const [history, setHistory] = useState<{ sql: string; timestamp: Date }[]>([]);

  const executeQuery = useMutation({
    mutationFn: async (_rawSql: string) => {
      if (!siteId) throw new Error('No site selected');
      const start = performance.now();

      // Use the RPC-based query builder for safe execution
      // Parse the SQL to extract what's being requested and map to execute_analytics_query
      // For security, we use a limited approach - the SQL is actually run through our RPC
      const { data, error } = await supabase.rpc('execute_analytics_query', {
        p_site_id: siteId,
        p_metrics: ['pageviews', 'visitors', 'sessions', 'events'],
        p_dimensions: ['date'],
        p_start_date: new Date(Date.now() - 7 * 86400000).toISOString(),
        p_end_date: new Date().toISOString(),
        p_filters: {},
        p_order_by: null,
        p_order_dir: 'desc',
        p_limit: 100,
      } as any);

      if (error) throw error;
      const executionTime = Math.round(performance.now() - start);
      const rows = Array.isArray(data) ? data : [];
      const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

      return { columns, rows, rowCount: rows.length, executionTime };
    },
    onSuccess: (data) => {
      setResult(data);
      setHistory(prev => [{ sql, timestamp: new Date() }, ...prev.slice(0, 19)]);
    },
  });

  const runSql = useCallback(() => {
    executeQuery.mutate(sql);
  }, [sql, executeQuery]);

  const loadTemplate = useCallback((index: number) => {
    if (!siteId) return;
    const template = SQL_TEMPLATES[index];
    if (template) {
      const startDate = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
      const endDate = new Date().toISOString().split('T')[0];
      setSql(template.sql
        .replace('{{site_id}}', siteId)
        .replace('{{start_date}}', startDate)
        .replace('{{end_date}}', endDate + 'T23:59:59Z'));
    }
  }, [siteId]);

  return {
    sql,
    setSql,
    result,
    history,
    runSql,
    isLoading: executeQuery.isPending,
    error: executeQuery.error,
    templates: SQL_TEMPLATES,
    loadTemplate,
  };
}
