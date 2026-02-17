import { Zap, BarChart3, Sparkles, Check } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type TrackingTier = 'lite' | 'standard' | 'full';

interface TrackingTierSelectorProps {
    value: TrackingTier;
    onChange: (tier: TrackingTier) => void;
    disabled?: boolean;
}

const tiers: { id: TrackingTier; name: string; size: string; icon: React.ElementType; features: string[]; description: string }[] = [
    {
        id: 'lite',
        name: 'Lite',
        size: '< 1.5 KB',
        icon: Zap,
        description: 'Ultra-lightweight for maximum performance',
        features: [
            'Pageviews',
            'Sessions & UTM',
            'Referrer tracking',
            'SPA support',
            'Custom events',
        ],
    },
    {
        id: 'standard',
        name: 'Standard',
        size: '< 3 KB',
        icon: BarChart3,
        description: 'Balanced tracking for most sites',
        features: [
            'Everything in Lite',
            'Core Web Vitals',
            'Form analytics',
            'Scroll depth',
            'Engagement time',
            'Outbound links',
            'File downloads',
            'Cross-domain tracking',
        ],
    },
    {
        id: 'full',
        name: 'Full',
        size: '< 5 KB',
        icon: Sparkles,
        description: 'Complete analytics suite',
        features: [
            'Everything in Standard',
            'Video analytics',
            'Site search',
            'Social shares',
            'Error tracking',
            'Reading depth',
        ],
    },
];

export function TrackingTierSelector({ value, onChange, disabled }: TrackingTierSelectorProps) {
    return (
        <RadioGroup
            value={value}
            onValueChange={(v) => onChange(v as TrackingTier)}
            className="grid gap-4 md:grid-cols-3"
            disabled={disabled}
        >
            {tiers.map((tier) => {
                const Icon = tier.icon;
                const isSelected = value === tier.id;

                return (
                    <Label
                        key={tier.id}
                        htmlFor={tier.id}
                        className={cn(
                            "relative flex flex-col cursor-pointer rounded-xl border-2 p-4 transition-all",
                            isSelected
                                ? "border-primary bg-primary/5 ring-1 ring-primary"
                                : "border-border bg-background hover:border-primary/50 hover:bg-muted/30",
                            disabled && "cursor-not-allowed opacity-50"
                        )}
                    >
                        <RadioGroupItem
                            id={tier.id}
                            value={tier.id}
                            className="sr-only"
                            disabled={disabled}
                        />

                        {/* Header */}
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className={cn(
                                    "p-2 rounded-lg",
                                    isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                )}>
                                    <Icon className="h-4 w-4" />
                                </div>
                                <div>
                                    <span className="font-semibold">{tier.name}</span>
                                    <span className="ml-2 text-xs font-mono text-muted-foreground">{tier.size}</span>
                                </div>
                            </div>
                            {isSelected && (
                                <Check className="h-5 w-5 text-primary" />
                            )}
                        </div>

                        {/* Description */}
                        <p className="text-sm text-muted-foreground mb-3">{tier.description}</p>

                        {/* Features */}
                        <ul className="space-y-1.5 text-xs">
                            {tier.features.map((feature, i) => (
                                <li key={i} className="flex items-center gap-1.5 text-muted-foreground">
                                    <span className={cn(
                                        "h-1 w-1 rounded-full",
                                        isSelected ? "bg-primary" : "bg-muted-foreground/50"
                                    )} />
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    </Label>
                );
            })}
        </RadioGroup>
    );
}

export function getScriptFilename(tier: TrackingTier): string {
    switch (tier) {
        case 'lite':
            return 'track-lite.js';
        case 'full':
            return 'track-full.js';
        case 'standard':
        default:
            return 'track.js';
    }
}