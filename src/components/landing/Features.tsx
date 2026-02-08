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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Import refactored components
import { BentoCard } from "./features/BentoCard";
import { ComparisonTable } from "./features/ComparisonTable";
import { LiveDemoSection } from "./features/LiveDemoSection";

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

export function Features() {
  return (
    <>
      <section id="features" className="py-24 bg-background relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 md:px-8">
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

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[minmax(280px,auto)]">
            {/* Large Card: Real-time - Row 1 */}
            <BentoCard
              className="md:col-span-2 md:row-span-2"
              icon={BarChart3}
              title="Real-time Traffic Insights"
              description="Watch your traffic spike in real-time. See exactly how many people are on your site right now, what pages they're viewing, and where they're coming from."
              illustration={RealtimeIllustration}
            />

            {/* Card: Events - Row 1 */}
            <BentoCard
              className="md:col-span-1 md:row-span-2"
              icon={MousePointerClick}
              title="Custom Events"
              description="Track any user action with a single line of code. Signups, purchases, button clicks - capture it all."
              illustration={EventsIllustration}
              delay={0.1}
            />

            {/* Card: Funnels - Row 1 */}
            <BentoCard
              className="md:col-span-1"
              icon={GitBranch}
              title="Funnel Analysis"
              description="Identify where users drop off in your conversion flows."
              illustration={FunnelIllustration}
              delay={0.2}
            />

            {/* Card: Cohorts - Row 2 */}
            <BentoCard
              className="md:col-span-1"
              icon={Users}
              title="Retention Cohorts"
              description="Measure sticky users and product retention over time."
              illustration={CohortIllustration}
              delay={0.3}
            />

            {/* Large Card: Privacy - Row 2 */}
            <BentoCard
              className="md:col-span-2"
              icon={Shield}
              title="Privacy-First & GDPR Compliant"
              description="No IP tracking. No fingerprints. No cookies. We respect your users' privacy so you don't need any annoying cookie banners."
              illustration={PrivacyIllustration}
              delay={0.1}
            />

            {/* Card: Geo - Row 2 */}
            <BentoCard
              className="md:col-span-1"
              icon={Globe}
              title="Global Reach"
              description="Detailed breakdown of countries, cities, and regions."
              illustration={GeoIllustration}
              delay={0.2}
            />

            {/* Card: Script */}
            <BentoCard
              className="md:col-span-1"
              icon={Zap}
              title="Ultralight Script"
              description="< 1KB script. Zero impact on your site's performance scores."
              illustration={ScriptSizeIllustration}
              delay={0.3}
            />

            {/* Large Card: User Journeys - Row 3 */}
            <BentoCard
              className="md:col-span-2"
              icon={Route}
              title="User Journeys"
              description="Visualize the exact path users take through your website. Optimize navigation flows based on real data."
              illustration={JourneyIllustration}
              delay={0.2}
            />

            {/* Card: Command Menu */}
            <BentoCard
              className="md:col-span-1"
              icon={Command}
              title="Command Menu"
              description="Navigate your entire dashboard without lifting your fingers."
              illustration={CommandIllustration}
              delay={0.3}
            />

            {/* Card: Team */}
            <BentoCard
              className="md:col-span-1"
              icon={UserPlus}
              title="Team Access"
              description="Invite your whole team. Share dashboards via public links."
              illustration={TeamIllustration}
              delay={0.4}
            />

            {/* Card: Project */}
            <BentoCard
              className="md:col-span-1"
              icon={LayoutTemplate}
              title="Unlimited Projects"
              description="Track as many websites as you want from a single account."
              illustration={ProjectsIllustration}
              delay={0.5}
            />

            {/* Card: Export */}
            <BentoCard
              className="md:col-span-1"
              icon={Download}
              title="Data Ownership"
              description="It's your data. Export it to CSV or import from other tools anytime."
              illustration={ExportIllustration}
              delay={0.2}
            />

            {/* Card: Languages */}
            <BentoCard
              className="md:col-span-1"
              icon={Languages}
              title="Languages"
              description="Most popular languages among your visitors."
              illustration={LanguagesIllustration}
              delay={0.3}
            />

            {/* Card: Breakdown */}
            <BentoCard
              className="md:col-span-1"
              icon={Database}
              title="Breakdown Analysis"
              description="Slice and dice your data. Breakdown by any property to find hidden trends."
              illustration={BreakdownIllustration}
              delay={0.4}
            />

            {/* Card: Revenue */}
            <BentoCard
              className="md:col-span-1"
              icon={DollarSign}
              title="Revenue Tracking"
              description="Track ecommerce revenue, average order value, and conversion goals."
              illustration={RevenueIllustration}
              delay={0.2}
            />

            {/* Card: Attribution */}
            <BentoCard
              className="md:col-span-1"
              icon={Magnet}
              title="Attribution Models"
              description="Understand the customer journey with First-touch and Linear models."
              illustration={AttributionIllustration}
              delay={0.3}
            />

            {/* Card: Devices */}
            <BentoCard
              className="md:col-span-1"
              icon={Smartphone}
              title="Device & OS"
              description="Granular breakdown of what devices, browsers, and OS your users use."
              illustration={DeviceIllustration}
              delay={0.4}
            />

            {/* Card: Social */}
            <BentoCard
              className="md:col-span-1"
              icon={Twitter}
              title="Social Analytics"
              description="Track mentions and link clicks from social platforms like X (Twitter)."
              illustration={SocialIllustration}
              delay={0.5}
            />

            {/* Card: API */}
            <BentoCard
              className="md:col-span-1"
              icon={Code2}
              title="API & Webhooks"
              description="Programmatic access to data and Slack/Discord alerts via webhooks."
              illustration={ApiIllustration}
              delay={0.2}
            />

            {/* Card: Email Reports */}
            <BentoCard
              className="md:col-span-1"
              icon={Mail}
              title="Email Reports"
              description="Get weekly or monthly summaries delivered straight to your inbox."
              illustration={EmailIllustration}
              delay={0.3}
            />

            {/* Card: Cross Domain */}
            <BentoCard
              className="md:col-span-1"
              icon={Globe2}
              title="Cross-domain"
              description="Unified analytics across multiple domains and subdomains."
              illustration={CrossDomainIllustration}
              delay={0.4}
            />

            {/* Card: Insight Drilldown */}
            <BentoCard
              className="md:col-span-1"
              icon={Lightbulb}
              title="Custom Reports"
              description="Build and share custom reports with specific filters."
              illustration={InsightsIllustration}
              delay={0.5}
            />

            {/* --- IMPLEMENTED ADVANCED FEATURES --- */}

            {/* Card: A/B Testing */}
            <BentoCard
              className="md:col-span-1"
              icon={FlaskConical}
              title="A/B Testing"
              description="Test different content and layouts to optimize conversions."
              illustration={ABTestIllustration}
              delay={0.2}
            />

            {/* Card: Bot Detection */}
            <BentoCard
              className="md:col-span-1"
              icon={Bot}
              title="Bot Protection"
              description="Automatically filter out bots, spiders, and scrapers from your data."
              illustration={BotIllustration}
              delay={0.3}
            />

            {/* Card: Form Analytics */}
            <BentoCard
              className="md:col-span-1"
              icon={FormInput}
              title="Form Analytics"
              description="Identify which fields cause users to abandon your forms."
              illustration={FormIllustration}
              delay={0.4}
            />

            {/* Card: Scroll Depth */}
            <BentoCard
              className="md:col-span-1"
              icon={ArrowDownToLine}
              title="Scroll Depth"
              description="See exactly how far users scroll down your pages."
              illustration={ScrollIllustration}
              delay={0.5}
            />

            {/* Card: File Downloads */}
            <BentoCard
              className="md:col-span-1"
              icon={FileDown}
              title="File Downloads"
              description="Automatically track PDF, document, and asset downloads."
              illustration={FileDownloadIllustration}
              delay={0.2}
            />

            {/* Card: Custom Alerts */}
            <BentoCard
              className="md:col-span-1"
              icon={AlertTriangle}
              title="Custom Alerts"
              description="Get notified instantly when key metrics spike or drop."
              illustration={AlertIllustration}
              delay={0.3}
            />

            {/* Card: Pixels */}
            <BentoCard
              className="md:col-span-1"
              icon={Image}
              title="Tracking Pixels"
              description="Embed invisible pixels to track views in emails and 3rd party sites."
              illustration={PixelIllustration}
              delay={0.4}
            />

            {/* Card: Time on Page */}
            <BentoCard
              className="md:col-span-1"
              icon={Timer}
              title="Time Tracking"
              description="Measure engagement with accurate time-on-page metrics."
              illustration={TimeIllustration}
              delay={0.5}
            />

            {/* Card: Entry/Exit */}
            <BentoCard
              className="md:col-span-1"
              icon={LogIn}
              title="Entry & Exit Pages"
              description="Know your top landing pages and where you lose the most users."
              illustration={EntryExitIllustration}
              delay={0.2}
            />

            {/* Card: High Performance */}
            <BentoCard
              className="md:col-span-1"
              icon={Gauge}
              title="High Scale"
              description="Built for scale. Optimized rollups that handle billions of records effortlessly."
              illustration={ScaleIllustration}
              delay={0.3}
            />

            {/* Card: Goals */}
            <BentoCard
              className="md:col-span-1"
              icon={Target}
              title="Goals & Revenue"
              description="Track custom goals with revenue properties and AOV."
              illustration={GoalsIllustration}
              delay={0.4}
            />

            {/* Card: Roll-up Reporting */}
            <BentoCard
              className="md:col-span-1"
              icon={Combine}
              title="Roll-up Reporting"
              description="Aggregate data across multiple sites in one view."
              illustration={RollupIllustration}
              delay={0.5}
            />

            {/* Card: Outbound Links */}
            <BentoCard
              className="md:col-span-1"
              icon={ExternalLink}
              title="Outbound Links"
              description="Auto-track clicks on external links leaving your site."
              illustration={OutboundLinkIllustration}
              delay={0.2}
            />

            {/* Card: Core Web Vitals */}
            <BentoCard
              className="md:col-span-1"
              icon={Activity}
              title="Core Web Vitals"
              description="Track LCP, CLS, FID, TTFB per page for SEO & performance."
              illustration={WebVitalsIllustration}
              delay={0.3}
            />

            {/* Card: Error Tracking */}
            <BentoCard
              className="md:col-span-1"
              icon={Bug}
              title="Error Tracking"
              description="Privacy-first JavaScript error monitoring without Sentry."
              illustration={ErrorTrackingIllustration}
              delay={0.4}
            />

            {/* Card: Site Search */}
            <BentoCard
              className="md:col-span-1"
              icon={Search}
              title="Site Search"
              description="Track internal search queries and zero-results patterns."
              illustration={SiteSearchIllustration}
              delay={0.5}
            />

            {/* Card: Reading Depth */}
            <BentoCard
              className="md:col-span-1"
              icon={BookOpen}
              title="Reading Depth"
              description="Track actual reading engagement vs scroll-through behavior."
              illustration={ReadingDepthIllustration}
              delay={0.2}
            />

            {/* Card: Video Analytics */}
            <BentoCard
              className="md:col-span-1"
              icon={Play}
              title="Video Analytics"
              description="Track play, pause, and completion rates for embedded videos."
              illustration={VideoIllustration}
              delay={0.3}
            />

            {/* Card: Mobile SDK */}
            <BentoCard
              className="md:col-span-1"
              icon={Smartphone}
              title="Mobile SDK"
              description="React Native and Flutter SDKs for mobile app analytics."
              illustration={MobileSDKIllustration}
              delay={0.4}
            />

            {/* Card: Social Share */}
            <BentoCard
              className="md:col-span-1"
              icon={Share2}
              title="Social Sharing"
              description="Track when users share your content to social platforms."
              illustration={SocialShareIllustration}
              delay={0.5}
            />

            {/* Card: Content Decay */}
            <BentoCard
              className="md:col-span-1"
              icon={TrendingDown}
              title="Content Decay"
              description="Get notified when high-performing pages start declining."
              illustration={ContentDecayIllustration}
              delay={0.2}
            />

            {/* --- COMING SOON FEATURES --- */}

            {/* Card: Heatmaps - COMING SOON (basic MVP exists but needs improvement) */}
            <BentoCard
              className="md:col-span-1"
              icon={MousePointerClick}
              title="Heatmaps"
              description="Visualize where users click, move, and scroll with stunning heatmaps."
              illustration={HeatmapIllustration}
              delay={0.3}
              comingSoon
            />

            {/* Card: Page Overlay */}
            <BentoCard
              className="md:col-span-1"
              icon={Layers3}
              title="Page Overlay"
              description="Visualize stats directly on your website with an overlay."
              illustration={PageOverlayIllustration}
              delay={0.4}
            />

            {/* Card: Tag Manager */}
            <BentoCard
              className="md:col-span-1"
              icon={Tag}
              title="Tag Manager"
              description="Manage tracking scripts without touching your code."
              illustration={TagIllustration}
              delay={0.5}
            />

            {/* Card: Log Analytics */}
            <BentoCard
              className="md:col-span-1"
              icon={FileText}
              title="Log Analytics"
              description="Import server logs from Apache, Nginx, and IIS."
              illustration={LogAnalyticsIllustration}
              delay={0.2}
            />

            {/* Card: Looker Studio / BI Connector */}
            <BentoCard
              className="md:col-span-1"
              icon={PieChart}
              title="BI Connector"
              description="Connect your analytics data to Looker Studio, Tableau, or Power BI."
              illustration={LookerStudioIllustration}
              delay={0.3}
            />

            {/* Card: White Labeling */}
            <BentoCard
              className="md:col-span-1"
              icon={LayoutTemplate}
              title="White Labeling"
              description="Add your own branding and logo to the dashboard."
              illustration={WhiteLabelIllustration}
              delay={0.4}
            />

            {/* Card: SSO / SAML */}
            <BentoCard
              className="md:col-span-1"
              icon={KeyRound}
              title="SSO / SAML"
              description="Enterprise-grade Single Sign-On integration."
              illustration={SSOIllustration}
              delay={0.5}
            />
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <ComparisonTable />

      {/* Live Demo Section */}
      <LiveDemoSection />
    </>
  );
}
