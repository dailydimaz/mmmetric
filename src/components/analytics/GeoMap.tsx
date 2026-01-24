import { useMemo, useState } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import { GeoStat } from "@/hooks/useAnalytics";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2 } from "lucide-react";

// TopoJSON for the world map - using a reliable CDN source
const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface GeoMapProps {
    data: GeoStat[] | undefined;
    isLoading: boolean;
    onCountryClick?: (countryCode: string) => void;
}

const countryNames: Record<string, string> = {
    US: "United States", GB: "United Kingdom", DE: "Germany", FR: "France", CA: "Canada",
    AU: "Australia", JP: "Japan", CN: "China", IN: "India", BR: "Brazil",
    NL: "Netherlands", ES: "Spain", IT: "Italy", KR: "South Korea", RU: "Russia",
    // Add more mappings as needed or rely on the map topology properties
};

export function GeoMap({ data, isLoading, onCountryClick }: GeoMapProps) {
    const [tooltipContent, setTooltipContent] = useState("");

    const colorScale = useMemo(() => {
        if (!data || data.length === 0) {
            return () => "#F3F4F6"; // Default color
        }
        const maxVal = Math.max(...data.map(d => d.visits));

        // Create a linear scale from light blue to dark blue (using css variables would be better but d3 needs hex)
        return scaleLinear<string>()
            .domain([0, maxVal])
            .range(["#E0E7FF", "#3B82F6"]);
    }, [data]);

    const countryData = useMemo(() => {
        const map = new Map();
        data?.forEach(d => {
            // Metric uses 2-letter ISO codes, need to match with TopoJSON
            // This is a simplification; in a real app might need ISO-2 to ISO-3 or name mapping
            map.set(d.country, d);
        });
        return map;
    }, [data]);

    if (isLoading) {
        return (
            <div className="h-[300px] w-full flex items-center justify-center bg-muted/20 rounded-lg">
                <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
            </div>
        );
    }

    return (
        <div className="w-full h-[400px] overflow-hidden rounded-lg bg-muted/10 border border-border/50 relative">
            <ComposableMap projectionConfig={{ scale: 147 }} data-tip="">
                <ZoomableGroup center={[0, 0]} maxZoom={4}>
                    <Geographies geography={GEO_URL}>
                        {({ geographies }) =>
                            geographies.map((geo) => {
                                // Attempt to match by name or ISO code properties
                                // TopoJSON properties usually have ISO_A2 or NAME
                                const countryCode = geo.properties.ISO_A2 || geo.properties.code;
                                // Note: simple maps topology matching can be tricky.
                                // For this demo, we'll try to match loosely or default to gray.

                                // For now, let's just color everything uniform to verify render, then enhance
                                // Ideally we map `geo.properties.ISO_A2` to our `countryData` keys

                                const stat = data?.find(d => d.country === geo.properties.ISO_A2);
                                const fill = stat ? colorScale(stat.visits) : "#F1F5F9"; // slate-100

                                return (
                                    <Geography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        onMouseEnter={() => {
                                            const name = geo.properties.name || "Unknown";
                                            const visits = stat ? `${stat.visits} visits` : "";
                                            setTooltipContent(`${name} ${visits}`);
                                        }}
                                        onMouseLeave={() => {
                                            setTooltipContent("");
                                        }}
                                        onClick={() => {
                                            if (geo.properties.ISO_A2 && onCountryClick) {
                                                onCountryClick(geo.properties.ISO_A2);
                                            }
                                        }}
                                        style={{
                                            default: {
                                                fill: fill,
                                                outline: "none",
                                                stroke: "#94A3B8", // slate-400
                                                strokeWidth: 0.5,
                                            },
                                            hover: {
                                                fill: "#2563EB", // blue-600
                                                outline: "none",
                                                cursor: "pointer",
                                                stroke: "#1D4ED8",
                                                strokeWidth: 0.75
                                            },
                                            pressed: {
                                                fill: "#1E40AF",
                                                outline: "none",
                                            },
                                        }}
                                    />
                                );
                            })
                        }
                    </Geographies>
                </ZoomableGroup>
            </ComposableMap>

            {tooltipContent && (
                <div className="absolute top-4 left-4 bg-background/90 backdrop-blur px-3 py-1.5 rounded-md border shadow-sm text-sm font-medium z-10 pointer-events-none transition-all">
                    {tooltipContent}
                </div>
            )}
        </div>
    );
}
