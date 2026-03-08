import { useState } from "react";
import { MapPin, Building2, Map as MapIcon, Layers, MapPinned } from "lucide-react";
import { GeoStat, CityStat, DateRange } from "@/hooks/useAnalytics";
import { useRegionStats, RegionStat } from "@/hooks/useRegionStats";
import { GeoMap } from "./GeoMap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface GeoStatsProps {
  countries: GeoStat[] | undefined;
  cities: CityStat[] | undefined;
  isLoading: boolean;
  onBreakdown?: (country: string) => void;
  siteId?: string;
  dateRange?: DateRange;
}

// Country code to flag emoji
function getCountryFlag(countryCode: string): string {
  const code = countryCode.toUpperCase();
  if (code.length !== 2) return "🌍";
  const offset = 127397;
  return String.fromCodePoint(...[...code].map(c => c.charCodeAt(0) + offset));
}

// Country code to name (basic mapping)
const countryNames: Record<string, string> = {
  US: "United States", GB: "United Kingdom", DE: "Germany", FR: "France", CA: "Canada",
  AU: "Australia", JP: "Japan", CN: "China", IN: "India", BR: "Brazil",
  NL: "Netherlands", ES: "Spain", IT: "Italy", KR: "South Korea", RU: "Russia",
  MX: "Mexico", ID: "Indonesia", SE: "Sweden", NO: "Norway", DK: "Denmark",
  FI: "Finland", PL: "Poland", AT: "Austria", CH: "Switzerland", BE: "Belgium",
  PT: "Portugal", IE: "Ireland", NZ: "New Zealand", SG: "Singapore", HK: "Hong Kong",
};

function getCountryName(code: string): string {
  return countryNames[code.toUpperCase()] || code;
}

export function GeoStats({ countries, cities, isLoading, onBreakdown, siteId, dateRange }: GeoStatsProps) {
  const [activeTab, setActiveTab] = useState<"countries" | "regions" | "cities">("countries");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [regionCountry, setRegionCountry] = useState<string | undefined>(undefined);

  const { data: regions, isLoading: regionsLoading } = useRegionStats({
    siteId: siteId || "",
    dateRange: dateRange || "7d",
    country: regionCountry,
  });

  const handleCountryClick = (country: string) => {
    // Switch to regions tab filtered by this country
    setRegionCountry(country);
    setActiveTab("regions");
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <MapIcon className="h-4 w-4" />
          </div>
          <CardTitle className="text-base font-semibold">Locations</CardTitle>
        </div>

        <div className="flex items-center gap-2">
          <ToggleGroup type="single" value={viewMode} onValueChange={(val) => val && setViewMode(val as "list" | "map")} className="bg-muted p-1 rounded-lg mr-2">
            <ToggleGroupItem value="list" size="sm" className="h-7 w-7 p-0 data-[state=on]:bg-background data-[state=on]:shadow-sm">
              <Layers className="h-3 w-3" />
            </ToggleGroupItem>
            <ToggleGroupItem value="map" size="sm" className="h-7 w-7 p-0 data-[state=on]:bg-background data-[state=on]:shadow-sm">
              <MapIcon className="h-3 w-3" />
            </ToggleGroupItem>
          </ToggleGroup>

          <ToggleGroup type="single" value={activeTab} onValueChange={(val) => {
            if (val) {
              setActiveTab(val as "countries" | "regions" | "cities");
              if (val === "countries") setRegionCountry(undefined);
            }
          }} className="bg-muted p-1 rounded-lg">
            <ToggleGroupItem value="countries" size="sm" className="h-7 text-xs data-[state=on]:bg-background data-[state=on]:shadow-sm">
              Countries
            </ToggleGroupItem>
            <ToggleGroupItem value="regions" size="sm" className="h-7 text-xs data-[state=on]:bg-background data-[state=on]:shadow-sm">
              Regions
            </ToggleGroupItem>
            <ToggleGroupItem value="cities" size="sm" className="h-7 text-xs data-[state=on]:bg-background data-[state=on]:shadow-sm">
              Cities
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-hidden">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5 rounded" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-4 w-12" />
                </div>
              ))}
            </div>
          ) : viewMode === "map" ? (
            <div className="p-4">
              <GeoMap
                data={countries}
                cities={cities}
                isLoading={isLoading}
                onCountryClick={onBreakdown || handleCountryClick}
              />
            </div>
          ) : activeTab === "countries" ? (
            countries && countries.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="w-full pl-4">Location</TableHead>
                      <TableHead className="text-right">Visits</TableHead>
                      <TableHead className="text-right pr-4">%</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {countries.slice(0, 8).map((country, index) => (
                      <TableRow
                        key={index}
                        className="hover:bg-muted/50 border-b border-border last:border-0 cursor-pointer"
                        onClick={() => handleCountryClick(country.country)}
                      >
                        <TableCell className="w-full flex items-center gap-3 py-3 pl-4">
                          <span className="text-xl">{getCountryFlag(country.country)}</span>
                          <div className="relative flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-[100px] md:max-w-[150px]">
                            <div
                              className="absolute inset-y-0 left-0 bg-primary rounded-full"
                              style={{ width: `${country.percentage}%` }}
                            />
                          </div>
                          <span className="font-medium text-sm truncate w-24 md:w-auto hover:text-primary transition-colors">{getCountryName(country.country)}</span>
                        </TableCell>
                        <TableCell className="text-right font-medium py-3">{country.visits}</TableCell>
                        <TableCell className="text-right font-mono text-xs text-muted-foreground w-16 py-3 pr-4">{country.percentage.toFixed(0)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/40">
                <MapPin className="h-10 w-10 mb-2 opacity-20" />
                <p className="text-sm">No country data yet</p>
              </div>
            )
          ) : activeTab === "regions" ? (
            <>
              {regionCountry && (
                <div className="px-4 pt-3 flex items-center gap-2">
                  <span className="text-lg">{getCountryFlag(regionCountry)}</span>
                  <span className="text-sm font-medium text-muted-foreground">{getCountryName(regionCountry)}</span>
                  <button
                    onClick={() => { setRegionCountry(undefined); setActiveTab("countries"); }}
                    className="text-xs text-primary hover:underline ml-auto"
                  >
                    ← All countries
                  </button>
                </div>
              )}
              {regionsLoading ? (
                <div className="p-4 space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                  ))}
                </div>
              ) : regions && regions.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="w-full pl-4">Region</TableHead>
                        <TableHead className="text-right">Visits</TableHead>
                        <TableHead className="text-right pr-4">%</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {regions.slice(0, 10).map((region, index) => (
                        <TableRow key={index} className="hover:bg-muted/50 border-b border-border last:border-0">
                          <TableCell className="w-full flex items-center gap-3 py-3 pl-4">
                            <div className="p-1 rounded bg-muted text-muted-foreground">
                              <MapPinned className="h-3 w-3" />
                            </div>
                            <div className="relative flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-[100px] md:max-w-[150px]">
                              <div
                                className="absolute inset-y-0 left-0 bg-primary rounded-full"
                                style={{ width: `${region.percentage}%` }}
                              />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-medium text-sm truncate max-w-[120px]">{region.region}</span>
                              <span className="text-xs text-muted-foreground">{getCountryName(region.country)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium py-3">{region.visits}</TableCell>
                          <TableCell className="text-right font-mono text-xs text-muted-foreground w-16 py-3 pr-4">{region.percentage.toFixed(0)}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/40">
                  <MapPinned className="h-10 w-10 mb-2 opacity-20" />
                  <p className="text-sm">No region data yet</p>
                  <p className="text-xs mt-1">Region tracking is captured from visitor headers</p>
                </div>
              )}
            </>
          ) : (
            cities && cities.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="w-full pl-4">City</TableHead>
                      <TableHead className="text-right">Visits</TableHead>
                      <TableHead className="text-right pr-4">%</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cities.slice(0, 8).map((city, index) => (
                      <TableRow key={index} className="hover:bg-muted/50 border-b border-border last:border-0">
                        <TableCell className="w-full flex items-center gap-3 py-3 pl-4">
                          <div className="p-1 rounded bg-muted text-muted-foreground">
                            <Building2 className="h-3 w-3" />
                          </div>
                          <div className="relative flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-[100px] md:max-w-[150px]">
                            <div
                              className="absolute inset-y-0 left-0 bg-primary rounded-full"
                              style={{ width: `${city.percentage}%` }}
                            />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium text-sm truncate max-w-[120px]">{city.city}</span>
                            <span className="text-xs text-muted-foreground">{getCountryName(city.country)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium py-3">{city.visits}</TableCell>
                        <TableCell className="text-right font-mono text-xs text-muted-foreground w-16 py-3 pr-4">{city.percentage.toFixed(0)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/40">
                <Building2 className="h-10 w-10 mb-2 opacity-20" />
                <p className="text-sm">No city data yet</p>
              </div>
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
}
