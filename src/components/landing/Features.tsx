import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  MousePointerClick,
  GitBranch,
  Users,
  Zap,
  Shield,
  Code2,
  Globe,
  LayoutTemplate,
  Target,
  UserPlus,
  Download,
  Route,
  Command,
  TrendingDown,
  Smartphone,
  Languages,
  Database,
  Share2,
  Lightbulb,
  Image,
  DollarSign,
  Magnet,
  Mail,
  Twitter,
  Globe2,
  FlaskConical,
  Bot,
  ArrowDownToLine,
  AlertTriangle,
  Tag,
  FileDown,
  FormInput,
  Gauge,
  Timer,
  LogIn,
  Layers3,
  KeyRound,
  FileText,
  PieChart,
  Combine,
  Activity,
  Bug,
  BookOpen,
  Play,
  ExternalLink,
  Link2,
  Search,
  MessageSquare,
  Sparkles,
  GitCompare,
  ChevronDown,
  LucideIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// Import refactored components
import { BentoCard } from "./features/BentoCard";

// Import illustrations
import {
  RealtimeIllustration,
  EventsIllustration,
  FunnelIllustration,
  CohortIllustration,
  GeoIllustration,
  CommandIllustration,
  PrivacyIllustration,
  ScriptSizeIllustration,
  TeamIllustration,
  ProjectsIllustration,
  ExportIllustration,
} from "./features/illustrations/CoreIllustrations";

import {
  JourneyIllustration,
  HeatmapIllustration,
  ABTestIllustration,
  BotIllustration,
  FormIllustration,
  ScrollIllustration,
  TagIllustration,
  OutboundLinkIllustration,
  SocialShareIllustration,
  ContentDecayIllustration,
  ReadingDepthIllustration,
  VideoIllustration,
  SiteSearchIllustration,
  AnnotationsIllustration,
  EmbedWidgetIllustration,
  CliDocIllustration,
  AiInsightsIllustration,
  BenchmarkIllustration,
} from "./features/illustrations/AdvancedIllustrations";

import {
  BreakdownIllustration,
  TimeIllustration,
  EntryExitIllustration,
  ScaleIllustration,
  PageOverlayIllustration,
  SSOIllustration,
  LogAnalyticsIllustration,
  LookerStudioIllustration,
  RollupIllustration,
  WhiteLabelIllustration,
  LanguagesIllustration,
  GoalsIllustration,
  InsightsIllustration,
  RevenueIllustration,
  AttributionIllustration,
  DeviceIllustration,
  SocialIllustration,
  ApiIllustration,
  EmailIllustration,
  CrossDomainIllustration,
  DrilldownIllustration,
  FileDownloadIllustration,
  AlertIllustration,
  PixelIllustration,
  WebVitalsIllustration,
  ErrorTrackingIllustration,
  MobileSDKIllustration,
} from "./features/illustrations/EnterpriseIllustrations";

// Split features into data arrays for easier management and slicing
const coreFeatures = [
  { className: "md:col-span-2 md:row-span-2", icon: BarChart3, title: "Real-time Traffic Insights", description: "Watch your traffic spike in real-time. See exactly how many people are on your site right now, what pages they're viewing, and where they're coming from.", illustration: RealtimeIllustration },
  { className: "md:col-span-1 md:row-span-2", icon: MousePointerClick, title: "Custom Events", description: "Track any user action with a single line of code. Signups, purchases, button clicks - capture it all.", illustration: EventsIllustration, delay: 0.1 },
  { className: "md:col-span-1", icon: GitBranch, title: "Funnel Analysis", description: "Identify where users drop off in your conversion flows.", illustration: FunnelIllustration, delay: 0.2 },
  { className: "md:col-span-1", icon: Users, title: "Retention Cohorts", description: "Measure sticky users and product retention over time.", illustration: CohortIllustration, delay: 0.3 },
  { className: "md:col-span-2", icon: Shield, title: "Privacy-First & GDPR Compliant", description: "No IP tracking. No fingerprints. No cookies. We respect your users' privacy so you don't need any annoying cookie banners.", illustration: PrivacyIllustration, delay: 0.1 },
  { className: "md:col-span-1", icon: Globe, title: "Global Reach", description: "Detailed breakdown of countries, cities, and regions.", illustration: GeoIllustration, delay: 0.2 },
  { className: "md:col-span-1", icon: Zap, title: "Ultralight Script", description: "< 1KB script. Zero impact on your site's performance scores.", illustration: ScriptSizeIllustration, delay: 0.3 },
  { className: "md:col-span-2", icon: Route, title: "User Journeys", description: "Visualize the exact path users take through your website. Optimize navigation flows based on real data.", illustration: JourneyIllustration, delay: 0.2 },
  // 10 visible limit 
  { className: "md:col-span-1", icon: Command, title: "Command Menu", description: "Navigate your entire dashboard without lifting your fingers.", illustration: CommandIllustration, delay: 0.3 },
  { className: "md:col-span-1", icon: UserPlus, title: "Team Access", description: "Invite your whole team. Share dashboards via public links.", illustration: TeamIllustration, delay: 0.4 },
  { className: "md:col-span-1", icon: LayoutTemplate, title: "Unlimited Projects", description: "Track as many websites as you want from a single account.", illustration: ProjectsIllustration, delay: 0.5 },
  { className: "md:col-span-1", icon: Download, title: "Data Ownership", description: "It's your data. Export it to CSV or import from other tools anytime.", illustration: ExportIllustration, delay: 0.2 },
  { className: "md:col-span-1", icon: Languages, title: "Languages", description: "Most popular languages among your visitors.", illustration: LanguagesIllustration, delay: 0.3 },
  { className: "md:col-span-1", icon: Database, title: "Breakdown Analysis", description: "Slice and dice your data. Breakdown by any property to find hidden trends.", illustration: BreakdownIllustration, delay: 0.4 },
  { className: "md:col-span-1", icon: DollarSign, title: "Revenue Tracking", description: "Track ecommerce revenue, average order value, and conversion goals.", illustration: RevenueIllustration, delay: 0.2 },
  { className: "md:col-span-1", icon: Smartphone, title: "Device & OS", description: "Granular breakdown of what devices, browsers, and OS your users use.", illustration: DeviceIllustration, delay: 0.4 },
  { className: "md:col-span-1", icon: Twitter, title: "Social Analytics", description: "Track mentions and link clicks from social platforms like X (Twitter).", illustration: SocialIllustration, delay: 0.5 },
  { className: "md:col-span-1", icon: Mail, title: "Email Reports", description: "Get weekly or monthly summaries delivered straight to your inbox.", illustration: EmailIllustration, delay: 0.3 },
  { className: "md:col-span-1", icon: Timer, title: "Time Tracking", description: "Measure engagement with accurate time-on-page metrics.", illustration: TimeIllustration, delay: 0.5 },
  { className: "md:col-span-1", icon: LogIn, title: "Entry & Exit Pages", description: "Know your top landing pages and where you lose the most users.", illustration: EntryExitIllustration, delay: 0.2 },
  { className: "md:col-span-1", icon: ExternalLink, title: "Outbound Links", description: "Auto-track clicks on external links leaving your site.", illustration: OutboundLinkIllustration, delay: 0.2 },
  { className: "md:col-span-1", icon: Share2, title: "Social Sharing", description: "Track when users share your content to social platforms.", illustration: SocialShareIllustration, delay: 0.5 },
];

const advancedFeatures = [
  { className: "md:col-span-1", icon: Magnet, title: "Attribution Models", description: "Understand the customer journey with First-touch and Linear models.", illustration: AttributionIllustration, delay: 0.3 },
  { className: "md:col-span-1", icon: Lightbulb, title: "Custom Reports", description: "Build and share custom reports with specific filters.", illustration: InsightsIllustration, delay: 0.5 },
  { className: "md:col-span-2 md:row-span-2", icon: FlaskConical, title: "A/B Testing", description: "Test different content and layouts to optimize conversions.", illustration: ABTestIllustration, delay: 0.2 },
  { className: "md:col-span-1", icon: Bot, title: "Bot Protection", description: "Automatically filter out bots, spiders, and scrapers from your data.", illustration: BotIllustration, delay: 0.3 },
  { className: "md:col-span-1", icon: FormInput, title: "Form Analytics", description: "Identify which fields cause users to abandon your forms.", illustration: FormIllustration, delay: 0.4 },
  { className: "md:col-span-1", icon: ArrowDownToLine, title: "Scroll Depth", description: "See exactly how far users scroll down your pages.", illustration: ScrollIllustration, delay: 0.5 },
  { className: "md:col-span-1", icon: FileDown, title: "File Downloads", description: "Automatically track PDF, document, and asset downloads.", illustration: FileDownloadIllustration, delay: 0.2 },
  { className: "md:col-span-1", icon: Target, title: "Goals & Revenue", description: "Track custom goals with revenue properties and AOV.", illustration: GoalsIllustration, delay: 0.4 },
  // 10 visible limit
  { className: "md:col-span-1", icon: Search, title: "Site Search", description: "Track internal search queries and zero-results patterns.", illustration: SiteSearchIllustration, delay: 0.5 },
  { className: "md:col-span-1", icon: BookOpen, title: "Reading Depth", description: "Track actual reading engagement vs scroll-through behavior.", illustration: ReadingDepthIllustration, delay: 0.2 },
  { className: "md:col-span-1", icon: Play, title: "Video Analytics", description: "Track play, pause, and completion rates for embedded videos.", illustration: VideoIllustration, delay: 0.3 },
  { className: "md:col-span-1", icon: TrendingDown, title: "Content Decay", description: "Get notified when high-performing pages start declining.", illustration: ContentDecayIllustration, delay: 0.2 },
  { className: "md:col-span-2", icon: MessageSquare, title: "Annotations", description: "Add contextual notes directly onto your charts to track impacts of events.", illustration: AnnotationsIllustration, delay: 0.3 },
  { className: "md:col-span-1", icon: LayoutTemplate, title: "Embed Widgets", description: "Generate live SVG badges and counters for your site or repository.", illustration: EmbedWidgetIllustration, delay: 0.4 },
  { className: "md:col-span-1", icon: Command, title: "CLI Tool Docs", description: "Interact with your analytics seamlessly via the command line or scripts.", illustration: CliDocIllustration, delay: 0.5 },
  { className: "md:col-span-2", icon: Sparkles, title: "AI Insights", description: "Automated analysis and actionable traffic observations generated instantly.", illustration: AiInsightsIllustration, delay: 0.2 },
  { className: "md:col-span-1", icon: GitCompare, title: "Benchmarking", description: "Compare your performance accurately against deep industry standards.", illustration: BenchmarkIllustration, delay: 0.3 },
  { className: "md:col-span-1 md:row-span-2", icon: MousePointerClick, title: "Heatmaps", description: "Visualize where users click, move, and scroll with stunning heatmaps.", illustration: HeatmapIllustration, delay: 0.3 },
  { className: "md:col-span-1", icon: Layers3, title: "Page Overlay", description: "Visualize stats directly on your website with an overlay.", illustration: PageOverlayIllustration, delay: 0.4 },
];

const enterpriseFeatures = [
  { className: "md:col-span-1", icon: Code2, title: "API & Webhooks", description: "Programmatic access to data and Slack/Discord alerts via webhooks.", illustration: ApiIllustration, delay: 0.2 },
  { className: "md:col-span-1", icon: Globe2, title: "Cross-domain", description: "Unified analytics across multiple domains and subdomains.", illustration: CrossDomainIllustration, delay: 0.4 },
  { className: "md:col-span-1", icon: AlertTriangle, title: "Custom Alerts", description: "Get notified instantly when key metrics spike or drop.", illustration: AlertIllustration, delay: 0.3 },
  { className: "md:col-span-1", icon: Image, title: "Tracking Pixels", description: "Embed invisible pixels to track views in emails and 3rd party sites.", illustration: PixelIllustration, delay: 0.4 },
  { className: "md:col-span-2 md:row-span-2", icon: Gauge, title: "High Scale", description: "Built for scale. Optimized rollups that handle billions of records effortlessly.", illustration: ScaleIllustration, delay: 0.3 },
  { className: "md:col-span-2", icon: Combine, title: "Roll-up Reporting", description: "Aggregate data across multiple sites in one view.", illustration: RollupIllustration, delay: 0.5 },
  { className: "md:col-span-1", icon: Activity, title: "Core Web Vitals", description: "Track LCP, CLS, FID, TTFB per page for SEO & performance.", illustration: WebVitalsIllustration, delay: 0.3 },
  // 10 visible limit
  { className: "md:col-span-1", icon: Bug, title: "Error Tracking", description: "Privacy-first JavaScript error monitoring without Sentry.", illustration: ErrorTrackingIllustration, delay: 0.4 },
  { className: "md:col-span-1", icon: Smartphone, title: "Mobile SDK", description: "React Native and Flutter SDKs for mobile app analytics.", illustration: MobileSDKIllustration, delay: 0.4 },
  { className: "md:col-span-1", icon: Tag, title: "Tag Manager", description: "Manage tracking scripts without touching your code.", illustration: TagIllustration, delay: 0.5 },
  { className: "md:col-span-1 md:row-span-2", icon: FileText, title: "Log Analytics", description: "Import server logs from Apache, Nginx, and IIS.", illustration: LogAnalyticsIllustration, delay: 0.2 },
  { className: "md:col-span-1", icon: PieChart, title: "BI Connector", description: "Connect your analytics data to Looker Studio, Tableau, or Power BI.", illustration: LookerStudioIllustration, delay: 0.3 },
  { className: "md:col-span-1", icon: LayoutTemplate, title: "White Labeling", description: "Add your own branding and logo to the dashboard.", illustration: WhiteLabelIllustration, delay: 0.4 },
  { className: "md:col-span-2", icon: KeyRound, title: "SSO / SAML", description: "Enterprise-grade Single Sign-On integration.", illustration: SSOIllustration, delay: 0.5 },
];

export function Features() {
  const [expandedTabs, setExpandedTabs] = useState<Record<string, boolean>>({
    core: false,
    advanced: false,
    enterprise: false,
  });

  const toggleTab = (tab: string) => {
    setExpandedTabs(prev => ({ ...prev, [tab]: !prev[tab] }));
  };

  const renderFeatures = (featuresList: Array<{
    className: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    icon: any;
    title: string;
    description: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    illustration: any;
    delay?: number;
  }>, tab: string) => {
    const isExpanded = expandedTabs[tab];
    const INITIAL_LIMIT = 8;
    const visibleFeatures = isExpanded ? featuresList : featuresList.slice(0, INITIAL_LIMIT);

    return (
      <div className="flex flex-col gap-6 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[minmax(280px,auto)] grid-flow-dense">
          <AnimatePresence>
            {visibleFeatures.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className={feature.className}
              >
                <BentoCard
                  className="h-full"
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                  illustration={feature.illustration}
                  delay={feature.delay}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {featuresList.length > INITIAL_LIMIT && (
          <div className="flex flex-col items-center justify-center mt-6 relative pb-12">
            {!isExpanded && (
              <div className="absolute top-[-150px] left-0 w-full h-[150px] bg-gradient-to-t from-background to-transparent pointer-events-none z-10" />
            )}
            <Button
              variant="outline"
              className="rounded-full shadow-sm z-20 group bg-card hover:bg-muted"
              onClick={() => toggleTab(tab)}
            >
              {isExpanded ? `Show fewer features` : `See all ${featuresList.length} features`}
              <ChevronDown className={`ml-2 w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <section id="features" className="py-24 bg-background relative overflow-hidden">
        {/* Decorative elements */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 90, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-[40%_60%_70%_30%] blur-3xl pointer-events-none"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, -90, 0]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-secondary/5 rounded-[60%_40%_30%_70%] blur-3xl pointer-events-none"
        />

        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              Power-packed Features
            </Badge>
            <h2 className="text-4xl font-bold tracking-tight mb-4">
              Everything you need for <span className="text-primary">world-class analytics</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Simple enough for personal blogs, powerful enough for enterprise SaaS.
            </p>
          </div>

          <div className="flex flex-col w-full mb-8">
            <Tabs defaultValue="core" className="w-full">
              <div className="flex justify-center w-full mb-12">
                <TabsList className="h-12 grid grid-cols-3 max-w-[600px] w-full bg-muted/50 p-1">
                  <TabsTrigger value="core" className="h-full rounded-md text-sm sm:text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">Core Analytics</TabsTrigger>
                  <TabsTrigger value="advanced" className="h-full rounded-md text-sm sm:text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">Advanced Insights</TabsTrigger>
                  <TabsTrigger value="enterprise" className="h-full rounded-md text-sm sm:text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">Enterprise Power</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="core" className="mt-0 outline-none">
                {renderFeatures(coreFeatures, "core")}
              </TabsContent>

              <TabsContent value="advanced" className="mt-0 outline-none">
                {renderFeatures(advancedFeatures, "advanced")}
              </TabsContent>

              <TabsContent value="enterprise" className="mt-0 outline-none">
                {renderFeatures(enterpriseFeatures, "enterprise")}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>
    </>
  );
}
