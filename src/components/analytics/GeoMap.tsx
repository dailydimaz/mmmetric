import { useMemo, useState } from "react";
import { GeoStat, CityStat } from "@/hooks/useAnalytics";
import { Loader2, Users, Eye, MousePointerClick, TrendingUp, Plus, Minus, RotateCcw, Building2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Map, Overlay } from "pigeon-maps";
import { maptiler } from 'pigeon-maps/providers';

interface GeoMapProps {
    data: GeoStat[] | undefined;
    cities?: CityStat[] | undefined;
    isLoading: boolean;
    onCountryClick?: (countryCode: string) => void;
}

// Map Country code to lat/lng for plotting countries over the map, since Pigeon Maps doesn't natively shade countries.
const countryCentroids: Record<string, [number, number]> = {
    US: [37.09, -95.71], GB: [55.37, -3.43], DE: [51.16, 10.45], FR: [46.22, 2.21], CA: [56.13, -106.34],
    AU: [-25.27, 133.77], JP: [36.20, 138.25], CN: [35.86, 104.19], IN: [20.59, 78.96], BR: [-14.23, -51.92],
    NL: [52.13, 5.29], ES: [40.46, -3.74], IT: [41.87, 12.56], KR: [35.90, 127.76], RU: [61.52, 105.31],
    MX: [23.63, -102.55], ID: [-0.78, 113.92], SE: [60.12, 18.64], NO: [60.47, 8.46], DK: [56.26, 9.50],
    FI: [61.92, 25.74], PL: [51.91, 19.14], AT: [47.51, 14.55], CH: [46.81, 8.22], BE: [50.50, 4.46],
    PT: [39.39, -8.22], IE: [53.41, -8.24], NZ: [-40.90, 174.88], SG: [1.35, 103.81], HK: [22.39, 114.10],
    AR: [-38.41, -63.61], CL: [-35.67, -71.54], CO: [4.57, -74.29], PH: [12.87, 121.77], TH: [15.87, 100.99],
    MY: [4.21, 101.97], VN: [14.05, 108.27], ZA: [-30.55, 22.93], NG: [9.08, 8.67], EG: [26.82, 30.80],
    UA: [48.37, 31.16], CZ: [49.81, 15.47], RO: [45.94, 24.96], HU: [47.16, 19.50], GR: [39.07, 21.82],
    TR: [38.96, 35.24], IL: [31.04, 34.85], AE: [23.42, 53.84], SA: [23.88, 45.07], PK: [30.37, 69.34],
    BD: [23.68, 90.35], TW: [23.69, 120.96], KE: [-0.02, 37.90], MA: [31.79, -7.09], DZ: [28.03, 1.65],
    PE: [-9.18, -75.01], VE: [6.42, -66.58], EC: [-1.83, -78.18], GT: [15.78, -90.23], CR: [9.74, -83.75],
};

const countryNames: Record<string, string> = {
    US: "United States", GB: "United Kingdom", DE: "Germany", FR: "France", CA: "Canada",
    AU: "Australia", JP: "Japan", CN: "China", IN: "India", BR: "Brazil",
    NL: "Netherlands", ES: "Spain", IT: "Italy", KR: "South Korea", RU: "Russia",
    MX: "Mexico", ID: "Indonesia", SE: "Sweden", NO: "Norway", DK: "Denmark",
    FI: "Finland", PL: "Poland", AT: "Austria", CH: "Switzerland", BE: "Belgium",
    PT: "Portugal", IE: "Ireland", NZ: "New Zealand", SG: "Singapore", HK: "Hong Kong",
    AR: "Argentina", CL: "Chile", CO: "Colombia", PH: "Philippines", TH: "Thailand",
    MY: "Malaysia", VN: "Vietnam", ZA: "South Africa", NG: "Nigeria", EG: "Egypt",
    UA: "Ukraine", CZ: "Czech Republic", RO: "Romania", HU: "Hungary", GR: "Greece",
    TR: "Turkey", IL: "Israel", AE: "United Arab Emirates", SA: "Saudi Arabia", PK: "Pakistan",
    BD: "Bangladesh", TW: "Taiwan", KE: "Kenya", MA: "Morocco", DZ: "Algeria",
    PE: "Peru", VE: "Venezuela", EC: "Ecuador", GT: "Guatemala", CR: "Costa Rica",
};

// Map Providers matching Mapbox styles approximately utilizing standard options
const maptilerProvider = maptiler('P01O1TjD4zUvI07wK81L', 'streets');

function getCountryName(code: string): string {
    return countryNames[code?.toUpperCase()] || code || "Unknown";
}

function getCountryFlag(countryCode: string): string {
    const code = countryCode?.toUpperCase();
    if (!code || code.length !== 2) return "🌍";
    const offset = 127397;
    return String.fromCodePoint(...[...code].map(c => c.charCodeAt(0) + offset));
}

function formatCompactNumber(number: number) {
    return new Intl.NumberFormat('en-US', {
        notation: "compact",
        maximumFractionDigits: 1
    }).format(number);
}

export function GeoMap({ data, cities, isLoading, onCountryClick }: GeoMapProps) {
    const [center, setCenter] = useState<[number, number]>([20, 0]);
    const [zoom, setZoom] = useState(2);

    const [hoveredCountry, setHoveredCountry] = useState<{
        code: string;
        name: string;
        visits: number;
        percentage: number;
        x: number;
        y: number;
    } | null>(null);
    const [hoveredCity, setHoveredCity] = useState<{
        city: string;
        country: string;
        visits: number;
        percentage: number;
        x: number;
        y: number;
    } | null>(null);

    const { hasData, maxCountryVisits, maxCityVisits } = useMemo(() => {
        if (!data || data.length === 0) {
            return { hasData: false, maxCountryVisits: 0, maxCityVisits: 0 };
        }

        const maxCountries = Math.max(...data.map(d => d.visits), 1);
        const maxCities = Math.max(...(cities?.map(c => c.visits) || [1]));

        return {
            hasData: true,
            maxCountryVisits: maxCountries,
            maxCityVisits: maxCities
        };
    }, [data, cities]);

    // Get top 5 countries for the legend
    const topCountries = useMemo(() => {
        if (!data) return [];
        return [...data]
            .sort((a, b) => b.visits - a.visits)
            .slice(0, 5);
    }, [data]);

    const getTopCities = (countryCode: string) => {
        if (!cities) return [];
        return cities
            .filter(c => c.country?.toUpperCase() === countryCode)
            .sort((a, b) => b.visits - a.visits)
            .slice(0, 3);
    };

    const handleZoomIn = () => {
        setZoom(Math.min(zoom + 1, 18));
    };

    const handleZoomOut = () => {
        setZoom(Math.max(zoom - 1, 1));
    };

    const handleResetZoom = () => {
        setCenter([20, 0]);
        setZoom(2);
    };

    if (isLoading) {
        return (
            <div className="h-[400px] w-full flex items-center justify-center bg-muted/20 rounded-lg">
                <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
            </div>
        );
    }

    const topCitiesForHover = hoveredCountry ? getTopCities(hoveredCountry.code) : [];

    // Helper functions for sizing markers logarithmically based on visits
    const getCountrySize = (visits: number) => {
        if (!maxCountryVisits) return 12;
        const ratio = Math.sqrt(visits / maxCountryVisits);
        return 16 + (ratio * 20); // 16px to 36px 
    };

    const getCitySize = (visits: number) => {
        if (!maxCityVisits) return 8;
        const ratio = Math.sqrt(visits / maxCityVisits);
        return 10 + (ratio * 16); // 10px to 26px
    };

    return (
        <div className="w-full rounded-lg bg-gradient-to-br from-muted/20 to-muted/5 border border-border/50 relative group">
            {/* Zoom Controls */}
            <div className="absolute top-4 right-4 flex flex-col gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 shadow-sm bg-background/80 backdrop-blur hover:bg-background"
                    onClick={handleZoomIn}
                    disabled={zoom >= 18}
                >
                    <Plus className="h-4 w-4" />
                </Button>
                <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 shadow-sm bg-background/80 backdrop-blur hover:bg-background"
                    onClick={handleZoomOut}
                    disabled={zoom <= 1}
                >
                    <Minus className="h-4 w-4" />
                </Button>
                <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 shadow-sm bg-background/80 backdrop-blur hover:bg-background"
                    onClick={handleResetZoom}
                >
                    <RotateCcw className="h-4 w-4" />
                </Button>
            </div>

            {/* Map Container */}
            <div className="h-[400px] relative cursor-move active:cursor-grabbing bg-[#e0e4eb] dark:bg-[#1f2937] rounded-t-lg overflow-hidden pigeon-map-container">
                {/* 
                    To implement dark boundaries without breaking pigeon maps standard tiles, we just use invert filter 
                    on the tile class in global CSS, but here we can just use the natural tiles.
                */}
                <Map
                    center={center}
                    zoom={zoom}
                    onBoundsChanged={({ center, zoom }) => {
                        setCenter(center);
                        setZoom(zoom);
                    }}
                    mouseEvents={true}
                    touchEvents={true}
                    minZoom={1}
                >

                    {/* Render Country Centroids (for broader view) */}
                    {data?.map(country => {
                        const centroid = countryCentroids[country.country?.toUpperCase()];
                        if (!centroid || country.visits === 0) return null;

                        // Hide country markers if we are zoomed in closely (cities take over)
                        if (zoom > 4) return null;

                        const size = getCountrySize(country.visits);

                        return (
                            <Overlay
                                key={`country-${country.country}`}
                                anchor={centroid}
                                offset={[size / 2, size / 2]}
                            >
                                <div
                                    className="relative flex items-center justify-center group/marker cursor-pointer"
                                    style={{ width: size, height: size }}
                                    onMouseEnter={(e) => {
                                        setHoveredCountry({
                                            code: country.country,
                                            name: getCountryName(country.country),
                                            visits: country.visits,
                                            percentage: country.percentage,
                                            x: e.clientX,
                                            y: e.clientY
                                        });
                                    }}
                                    onMouseLeave={() => setHoveredCountry(null)}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onCountryClick?.(country.country);
                                    }}
                                >
                                    {/* Ripple Effect */}
                                    <div className="absolute inset-0 bg-primary/40 rounded-full animate-ping opacity-75" />
                                    {/* Main Marker */}
                                    <div className="absolute inset-0 bg-primary rounded-full shadow-md border-2 border-background flex items-center justify-center transition-transform group-hover/marker:scale-110">
                                        {(size > 24) && (
                                            <span className="text-primary-foreground font-bold font-mono" style={{ fontSize: size * 0.35 }}>
                                                {formatCompactNumber(country.visits)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </Overlay>
                        );
                    })}

                    {/* Render City Markers (takes precedence on zoom) */}
                    {cities?.filter(c => c.latitude != null && c.longitude != null).map((city) => {
                        // Only show cities that have real data mapped
                        const size = getCitySize(city.visits);

                        // Fade cities out when zoomed out all the way to keep global map clean
                        if (zoom <= 2) return null;

                        return (
                            <Overlay
                                key={`city-${city.country}-${city.city}`}
                                anchor={[city.latitude!, city.longitude!]}
                                offset={[size / 2, size / 2]}
                            >
                                <div
                                    className="relative flex items-center justify-center group/city cursor-pointer"
                                    style={{ width: size, height: size }}
                                    onMouseEnter={(e) => {
                                        setHoveredCity({
                                            city: city.city,
                                            country: city.country,
                                            visits: city.visits,
                                            percentage: city.percentage,
                                            x: e.clientX,
                                            y: e.clientY,
                                        });
                                    }}
                                    onMouseLeave={() => setHoveredCity(null)}
                                >
                                    <div className="absolute inset-0 bg-chart-2/80 backdrop-blur-sm rounded-full shadow-sm border-[1.5px] border-background transition-transform duration-200 group-hover/city:scale-125 group-hover/city:bg-chart-2 flex items-center justify-center overflow-hidden">
                                        {zoom > 5 && size > 16 && (
                                            <span className="text-[8px] font-bold text-white max-w-[90%] truncate opacity-0 group-hover/city:opacity-100 transition-opacity">
                                                {formatCompactNumber(city.visits)}
                                            </span>
                                        )}
                                    </div>

                                    {/* City Label when zoomed in */}
                                    {zoom >= 6 && (
                                        <div className="absolute top-[110%] left-1/2 -translate-x-1/2 whitespace-nowrap px-1.5 py-0.5 bg-background/80 backdrop-blur rounded text-[10px] font-semibold text-foreground pointer-events-none drop-shadow-sm">
                                            {city.city}
                                        </div>
                                    )}
                                </div>
                            </Overlay>
                        );
                    })}

                </Map>

                {/* Animated Tooltip */}
                <AnimatePresence>
                    {hoveredCountry && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ duration: 0.15 }}
                            style={{
                                position: 'fixed',
                                left: hoveredCountry.x + 10,
                                top: hoveredCountry.y - 10,
                                pointerEvents: 'none',
                                zIndex: 100, // Ensure high z-index
                            }}
                            className="fixed z-50 min-w-[220px] max-w-[280px]"
                        >
                            <div className="bg-background/95 backdrop-blur-xl p-3 rounded-xl border border-border shadow-xl">
                                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/50 transition-colors">
                                    <span className="text-2xl">{getCountryFlag(hoveredCountry.code)}</span>
                                    <div className="flex flex-col leading-none">
                                        <span className="font-semibold text-foreground text-sm">{hoveredCountry.name}</span>
                                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mt-0.5">
                                            {hoveredCountry.code}
                                        </span>
                                    </div>
                                </div>

                                {hoveredCountry.visits > 0 ? (
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="bg-muted/30 p-2 rounded-lg">
                                                <span className="text-xs text-muted-foreground flex items-center gap-1 mb-0.5">
                                                    <Users className="h-3 w-3" />
                                                    Visits
                                                </span>
                                                <span className="font-mono font-medium text-sm block">
                                                    {hoveredCountry.visits.toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="bg-muted/30 p-2 rounded-lg">
                                                <span className="text-xs text-muted-foreground flex items-center gap-1 mb-0.5">
                                                    <TrendingUp className="h-3 w-3" />
                                                    Share
                                                </span>
                                                <span className="font-mono font-medium text-sm block">
                                                    {hoveredCountry.percentage.toFixed(1)}%
                                                </span>
                                            </div>
                                        </div>

                                        {topCitiesForHover.length > 0 && (
                                            <div className="pt-1">
                                                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block flex items-center gap-1">
                                                    <Building2 className="h-3 w-3" />
                                                    Top Cities
                                                </span>
                                                <div className="space-y-1">
                                                    {topCitiesForHover.map((city) => (
                                                        <div key={city.city} className="flex items-center justify-between text-xs p-1.5 rounded hover:bg-muted/50 transition-colors">
                                                            <span className="font-medium truncate max-w-[100px]">{city.city}</span>
                                                            <span className="text-muted-foreground font-mono">{city.visits.toLocaleString()}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {onCountryClick && (
                                            <div className="pt-2 mt-1 border-t border-border/50 text-center">
                                                <span className="text-[10px] text-primary flex items-center justify-center gap-1 font-medium">
                                                    <MousePointerClick className="h-3 w-3" />
                                                    Click for breakdown
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground py-1">No visitors from this country</p>
                                )}
                            </div>
                        </motion.div>
                    )}
                    {/* City Tooltip */}
                    {hoveredCity && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ duration: 0.15 }}
                            style={{
                                position: 'fixed',
                                left: hoveredCity.x + 10,
                                top: hoveredCity.y - 10,
                                pointerEvents: 'none',
                                zIndex: 100,
                            }}
                            className="fixed z-50 min-w-[180px] max-w-[240px]"
                        >
                            <div className="bg-background/95 backdrop-blur-xl p-3 rounded-xl border border-border shadow-xl">
                                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/50 transition-colors">
                                    <Building2 className="h-4 w-4 text-chart-2" />
                                    <div className="flex flex-col leading-none">
                                        <span className="font-semibold text-foreground text-sm">{hoveredCity.city}</span>
                                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mt-0.5">
                                            {getCountryName(hoveredCity.country)} ({hoveredCity.country})
                                        </span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-muted/30 p-2 rounded-lg">
                                        <span className="text-xs text-muted-foreground flex items-center gap-1 mb-0.5">
                                            <Users className="h-3 w-3" />
                                            Visits
                                        </span>
                                        <span className="font-mono font-medium text-sm block">
                                            {hoveredCity.visits.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="bg-muted/30 p-2 rounded-lg">
                                        <span className="text-xs text-muted-foreground flex items-center gap-1 mb-0.5">
                                            <TrendingUp className="h-3 w-3" />
                                            Share
                                        </span>
                                        <span className="font-mono font-medium text-sm block">
                                            {hoveredCity.percentage.toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Bottom Legend & Stats */}
            <div className="px-4 py-3 border-t border-border/50 bg-muted/20">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                    {/* Top Countries Quick Stats */}
                    {topCountries.length > 0 ? (
                        <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 md:pb-0 hide-scrollbar">
                            <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">Global Top:</span>
                            <div className="flex items-center gap-2">
                                {topCountries.slice(0, 4).map((country) => (
                                    <button
                                        key={country.country}
                                        onClick={() => onCountryClick?.(country.country)}
                                        className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-background/60 hover:bg-background border border-border/50 transition-colors text-xs whitespace-nowrap"
                                    >
                                        <span>{getCountryFlag(country.country)}</span>
                                        <span className="font-medium">{country.visits.toLocaleString()}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <span className="text-xs text-muted-foreground font-medium">Pan & Zoom to explore visitors</span>
                    )}
                </div>
            </div>

            {/* No Data State */}
            {!hasData && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-20 pointer-events-none">
                    <div className="text-center">
                        <Eye className="h-10 w-10 mx-auto mb-2 text-muted-foreground/30" />
                        <p className="text-sm text-muted-foreground">No geographic data yet</p>
                    </div>
                </div>
            )}
        </div>
    );
}