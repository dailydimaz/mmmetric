
import { useState } from "react";
import { Link } from "react-router-dom";
import {
    LayoutDashboard,
    MousePointerClick,
    GitBranch,
    Users,
    Menu,
    ChevronDown,
    Globe,
    ArrowLeft
} from "lucide-react";
import mmmetricLogo from "@/assets/mmmetric-logo.png";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
    StatsCards,
    VisitorChart,
    TopPages,
    TopReferrers,
    DeviceStats,
    GeoStats,
    LanguageStats
} from "@/components/analytics";
import { addDays, format, subDays } from "date-fns";

// --- Mock Data ---

const now = new Date();
const dates = Array.from({ length: 30 }).map((_, i) => subDays(now, 29 - i));

const mockTimeSeries = dates.map(date => {
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const baseViews = isWeekend ? 800 : 1500;
    return {
        date: date.toISOString(),
        pageviews: baseViews + Math.floor(Math.random() * 500),
        visitors: (baseViews * 0.7) + Math.floor(Math.random() * 300),
    };
});

const mockStats = {
    totalPageviews: 45231,
    uniqueVisitors: 28402,
    bounceRate: 42.5,
    avgSessionDuration: 145,
    pageviewsChange: 12.5,
    visitorsChange: 8.2,
};

const mockTopPages = [
    { url: "/", pageviews: 21042, uniqueVisitors: 15400 },
    { url: "/blog/why-privacy-matters", pageviews: 8520, uniqueVisitors: 7200 },
    { url: "/docs/installation", pageviews: 4200, uniqueVisitors: 3100 },
    { url: "/pricing", pageviews: 3150, uniqueVisitors: 2800 },
    { url: "/about", pageviews: 1800, uniqueVisitors: 1500 },
];

const mockTopReferrers = [
    { referrer: "Direct", visits: 12500, percentage: 44 },
    { referrer: "google.com", visits: 8400, percentage: 30 },
    { referrer: "t.co", visits: 3200, percentage: 11 },
    { referrer: "github.com", visits: 2100, percentage: 7.5 },
    { referrer: "news.ycombinator.com", visits: 1800, percentage: 6.3 },
];

const mockDevices = {
    browsers: [
        { name: "Chrome", value: 17500, percentage: 62.5 },
        { name: "Safari", value: 6800, percentage: 24.2 },
        { name: "Firefox", value: 2350, percentage: 8.4 },
        { name: "Edge", value: 1370, percentage: 4.9 },
    ],
    operatingSystems: [
        { name: "Windows", value: 12700, percentage: 45.2 },
        { name: "Mac OS", value: 9200, percentage: 32.8 },
        { name: "iOS", value: 3500, percentage: 12.5 },
        { name: "Android", value: 2400, percentage: 8.5 },
    ],
    devices: [
        { name: "Desktop", value: 22000, percentage: 78.5 },
        { name: "Mobile", value: 5400, percentage: 19.2 },
        { name: "Tablet", value: 650, percentage: 2.3 },
    ],
};

const mockGeoStats = [
    { country: "US", visits: 12400, percentage: 44.2 },
    { country: "DE", visits: 4200, percentage: 15.0 },
    { country: "GB", visits: 3800, percentage: 13.5 },
    { country: "FR", visits: 2100, percentage: 7.5 },
    { country: "IN", visits: 1800, percentage: 6.4 },
];

const mockCityStats = [
    { city: "San Francisco", country: "US", visits: 3200, percentage: 11.4 },
    { city: "Berlin", country: "DE", visits: 2100, percentage: 7.5 },
    { city: "London", country: "GB", visits: 1900, percentage: 6.8 },
    { city: "New York", country: "US", visits: 1500, percentage: 5.3 },
    { city: "Paris", country: "FR", visits: 1200, percentage: 4.2 },
];

const mockLanguageStats = [
    { language: "en", percentage: 65.4, visits: 18400 },
    { language: "de", percentage: 12.2, visits: 3400 },
    { language: "es", percentage: 8.5, visits: 2400 },
    { language: "fr", percentage: 5.4, visits: 1520 },
];

// --- Live Demo Component ---

export default function LiveDemo() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Replicating Dashboard Sidebar Navigation
    const navItems = [
        { icon: LayoutDashboard, label: "Overview", href: "#", active: false },
        { icon: MousePointerClick, label: "Analytics", href: "#", active: true },
        { icon: GitBranch, label: "Funnels", href: "#", active: false },
        { icon: Users, label: "Retention", href: "#", active: false },
    ];

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border">
            <div className="p-6">
                <Link to="/" className="flex items-center gap-3 mb-8 px-2 group">
                    <img src={mmmetricLogo} alt="mmmetric" className="h-8 w-8 rounded-lg" />
                    <div className="flex flex-col">
                        <span className="font-display font-bold text-lg tracking-tight text-sidebar-foreground">mmmetric</span>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Live Demo</span>
                    </div>
                </Link>

                <div className="space-y-1">
                    {navItems.map((item) => (
                        <a
                            key={item.label}
                            href={item.href}
                            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 group relative ${item.active
                                ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground opacity-60 cursor-not-allowed'
                                }`}
                            onClick={(e) => !item.active && e.preventDefault()}
                        >
                            <item.icon className={`h-4 w-4 ${item.active ? "text-sidebar-foreground" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground"}`} />
                            {item.label}
                            {item.active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full"></span>}
                            {!item.active && <span className="ml-auto text-[10px] uppercase font-bold tracking-wider text-muted-foreground/70 bg-sidebar-accent px-1.5 py-0.5 rounded">Pro</span>}
                        </a>
                    ))}
                </div>

                <div className="mt-8 px-4 py-4 bg-sidebar-accent/50 rounded-xl border border-sidebar-border">
                    <h4 className="font-semibold text-sm mb-2 text-sidebar-foreground">Live Demo Mode</h4>
                    <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                        You are exploring a read-only potential of mmmetric.
                    </p>
                    <Link to="/auth?mode=signup">
                        <Button size="sm" className="w-full text-xs shadow-sm">
                            Get Started
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="mt-auto p-4 border-t border-sidebar-border/60">
                <Link to="/">
                    <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Home
                    </Button>
                </Link>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-background text-foreground font-sans">
            {/* Mobile Header */}
            <div className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-sidebar/95 backdrop-blur-sm sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <img src={mmmetricLogo} alt="mmmetric" className="h-8 w-8 rounded-lg" />
                    <span className="font-bold text-lg font-display">mmmetric</span>
                </div>
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                    <SheetContent side="left" className="p-0 w-72 border-r border-sidebar-border bg-sidebar">
                        <SidebarContent />
                    </SheetContent>
                    <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(true)}>
                        <Menu className="h-6 w-6" />
                    </Button>
                </Sheet>
            </div>

            <div className="flex">
                {/* Desktop Sidebar */}
                <aside className="hidden lg:block w-72 min-h-screen sticky top-0 h-screen overflow-y-auto bg-sidebar border-r border-sidebar-border">
                    <SidebarContent />
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 w-full overflow-hidden bg-background">
                    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 slide-in-from-bottom-2">
                        {/* Top Header */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                            <div className="flex items-center gap-4">
                                {/* Fake Site Selector */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="w-[220px] justify-between font-normal bg-card border-border h-10 shadow-sm">
                                            <div className="flex items-center gap-2">
                                                <div className="h-5 w-5 rounded bg-primary/10 flex items-center justify-center text-primary">
                                                    <Globe className="h-3.5 w-3.5" />
                                                </div>
                                                <span className="truncate font-medium text-sm">mmmetric.com</span>
                                            </div>
                                            <ChevronDown className="h-4 w-4 opacity-50" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-[220px]" align="start">
                                        <div className="px-2 py-1.5 text-xs text-muted-foreground">
                                            You are viewing a public demo.
                                            <br />Data is mocked for privacy.
                                        </div>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            {/* CTA Buttons */}
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-muted-foreground hidden sm:inline-block">Like what you see?</span>
                                <Link to="/auth">
                                    <Button variant="outline" size="sm">Sign in</Button>
                                </Link>
                                <Link to="/auth?mode=signup">
                                    <Button size="sm" className="shadow-lg shadow-primary/20">Start for Free</Button>
                                </Link>
                            </div>
                        </div>

                        {/* Page Title */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
                                    Analytics
                                </h1>
                                <p className="text-muted-foreground mt-1">
                                    Overview for mmmetric.com
                                </p>
                            </div>
                            {/* Mock Date Picker Display */}
                            <div className="flex items-center gap-2 text-muted-foreground text-sm bg-muted/50 px-3 py-1.5 rounded-md border border-border">
                                <span>Last 30 Days</span>
                                <span className="text-border">|</span>
                                <span className="text-xs">{format(subDays(new Date(), 30), 'MMM d')} - {format(new Date(), 'MMM d, yyyy')}</span>
                            </div>
                        </div>


                        {/* Analytics Components Grid */}
                        <div className="space-y-6 pb-10">
                            {/* Stats Overview */}
                            <StatsCards stats={mockStats} isLoading={false} />

                            {/* Main Chart */}
                            <VisitorChart data={mockTimeSeries} isLoading={false} />

                            {/* Two Column Layout */}
                            <div className="grid gap-6 lg:grid-cols-2">
                                <TopPages pages={mockTopPages} isLoading={false} />
                                <TopReferrers referrers={mockTopReferrers} isLoading={false} />
                            </div>

                            {/* Device Stats */}
                            <DeviceStats
                                browsers={mockDevices.browsers}
                                operatingSystems={mockDevices.operatingSystems}
                                devices={mockDevices.devices}
                                isLoading={false}
                            />

                            {/* Geo & Language Stats */}
                            <div className="grid gap-6 lg:grid-cols-2">
                                <GeoStats
                                    countries={mockGeoStats}
                                    cities={mockCityStats}
                                    isLoading={false}
                                />
                                <LanguageStats
                                    languages={mockLanguageStats}
                                    isLoading={false}
                                />
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

function ButtonBack() {
    return (
        <Link to="/">
            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 shrink-0 lg:hidden">
                <ArrowLeft className="h-4 w-4" />
            </Button>
        </Link>
    )
}
