import { useQuery } from "@tanstack/react-query";

export type IndustryCategory = 'SaaS' | 'E-commerce' | 'Media' | 'Agency' | 'Other';

export interface BenchmarkMetrics {
    bounceRate: number;        // Percentage
    avgSessionDuration: number; // Seconds
    pagesPerSession: number;    // Count
}

export const INDUSTRY_BENCHMARKS: Record<IndustryCategory, BenchmarkMetrics> = {
    'SaaS': {
        bounceRate: 55,
        avgSessionDuration: 120,
        pagesPerSession: 3.5,
    },
    'E-commerce': {
        bounceRate: 45,
        avgSessionDuration: 180,
        pagesPerSession: 4.8,
    },
    'Media': {
        bounceRate: 65,
        avgSessionDuration: 90,
        pagesPerSession: 1.8,
    },
    'Agency': {
        bounceRate: 50,
        avgSessionDuration: 150,
        pagesPerSession: 2.5,
    },
    'Other': {
        bounceRate: 60,
        avgSessionDuration: 100,
        pagesPerSession: 2.0,
    }
};

export const INDUSTRY_CATEGORIES = Object.keys(INDUSTRY_BENCHMARKS) as IndustryCategory[];

export function useBenchmarks(category: string | null | undefined) {
    return useQuery({
        queryKey: ['benchmarks', category],
        queryFn: async () => {
            // Simulate network request for future API migration
            return new Promise<BenchmarkMetrics>((resolve) => {
                const matchingCategory = INDUSTRY_CATEGORIES.find(c => c === category) || 'Other';
                setTimeout(() => resolve(INDUSTRY_BENCHMARKS[matchingCategory]), 100);
            });
        }
    });
}
