<p align="center">
  <img src="src/assets/mmmetric-logo.png" alt="mmmetric Logo" width="80" height="80">
</p>

<h1 align="center">mmmetric</h1>

<p align="center">
  <strong>Privacy-first, open-source web analytics</strong>
</p>

<p align="center">
  Simple, fast, and privacy-focused analytics for your websites and applications.
  <br />
  No cookies. GDPR compliant. Self-hostable.
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#usage">Usage</a> •
  <a href="#integrations">Integrations</a> •
  <a href="#self-hosting">Self-Hosting</a> •
  <a href="#contributing">Contributing</a>
</p>

---

## ✨ Features

### Core Analytics
- **Privacy-First & Cookie-less**: No personal data collection. Fully GDPR/CCPA compliant out of the box.
- **Real-time Dashboard**: Live visitor count, active pages, and activity feed (`RealtimeStats`, `RealtimeActivityFeed`).
- **Lightweight Tracker**: Three script variants — Lite (< 1.5 KB), Standard, and Full (with Web Vitals & Form tracking).
- **Multi-Site Management**: Group and manage multiple domains under unified dashboards (`SiteGroups`, `SiteGroupDashboard`).
- **Localization**: Built-in support for multiple languages (EN, ID, TH, VI, MY, PH).
- **Views per Visit Metric**: Track engagement depth with pages viewed per session (`EngagementStats`).
- **Keyboard Shortcuts**: Quick date range switching (T, D, W, M), navigation (G+D, G+S, G+H), and search (/) (`useKeyboardShortcuts`).
- **Flexible Chart Intervals**: Toggle between hourly, daily, weekly, and monthly aggregations (`IntervalSelector`).
- **Public Dashboards**: Share read-only analytics dashboards via token-based URLs (`PublicDashboard`).
- **Dark Mode**: Full light/dark theme support (`ThemeProvider`, `ThemeToggle`).

### Visitor & Engagement Analytics
- **Top Pages & Entry/Exit Pages**: Most-visited pages plus entry and exit point analysis (`TopPages`, `EntryExitStats`).
- **Referrer Tracking**: Top traffic sources with UTM parameter breakdown (`TopReferrers`, `UTMStats`).
- **Device, Browser & OS Stats**: Visitor device breakdown with filtering (`DeviceStats`).
- **Geo Analytics**: Country → Region → City drill-down for visitor locations (`GeoStats`, `GeoMap`, `useRegionStats`).
- **Language Stats**: Visitor language distribution (`LanguageStats`).
- **Scroll & Reading Depth**: Measure how far visitors scroll and read (`ScrollDepthStats`, `ReadingDepthStats`).
- **Outbound Link Tracking**: Track clicks to external sites (`OutboundLinksStats`).
- **File Download Tracking**: Monitor file download events (`FileDownloadsStats`).
- **Social Share Tracking**: Measure content virality and sharing metrics (`SocialShareStats`).
- **Video Analytics**: Track video engagement metrics (`VideoAnalyticsStats`).

### Behavior & Conversion
- **Session Recordings**: Visual playback of user interactions and navigation paths (`SessionRecordings`, `SessionPlayer`).
- **A/B Testing & Experiments**: Built-in experiment management with statistical reporting (`Experiments`, `ExperimentResults`).
- **Page Overlays & Heatmaps**: Visual analytics laid directly over your website UI (`PageOverlay`, `HeatmapView`).
- **Funnel Analysis**: Build and track multi-step conversion funnels (`Funnels`, `FunnelDetail`, `FunnelBuilder`, `FunnelChart`).
- **Journey Analysis**: Visualize multi-step user navigation paths (`Journeys`, `JourneyFlow`, `JourneyStats`).
- **Retention Cohorts**: Track user engagement and retention over time with matrix view (`Retention`, `Cohorts`, `RetentionMatrix`).
- **Custom Event Tracking**: Track button clicks, form submissions, and unique conversions (`CustomEvents`).
- **Custom Properties Breakdown**: Drill down into event metadata with key/value analytics (`CustomPropertiesBreakdown`).
- **Goal Tracking**: Set and monitor conversion goals (`GoalSetup`, `GoalsCard`).
- **Form Analytics**: Automatic form interaction tracking via the Full tracker (`FormStats`).
- **Site Search Analytics**: Analyze internal search queries (`SiteSearchStats`).
- **Saved Segments**: Save and reuse filter combinations for quick analysis (`useSegments`, `FilterBar`).

### Diagnostics & Intelligence
- **Error Tracking**: Client-side JavaScript error reporting and logging (`ErrorTrackingStats`).
- **Web Vitals**: Core Web Vitals performance monitoring (LCP, FID, CLS) via the Full tracker (`WebVitalsStats`).
- **Multi-Touch Attribution**: Track user sources and campaign effectiveness (`Attribution`, `AttributionStats`, `AttributionChart`).
- **Content Decay Monitoring**: Detect declining page performance over time (`ContentDecayAlerts`, `useContentDecay`).
- **Anomaly Detection**: Automatic detection of unusual traffic patterns (`AnomalyDetectionStats`, `useAnomalyDetection`).
- **Traffic Forecasting**: Predictive analytics for future traffic trends (`ForecastChart`, `useForecast`).
- **AI-Powered Insights**: Auto-generated analytics insights and custom insight builder (`Insights`, `InsightsBuilder`, `InsightsList`).
- **Industry Benchmarks**: Compare your metrics against industry averages (`BenchmarkCard`, `useBenchmarks`).

### Comparison & Reporting
- **Year-over-Year Comparison**: Compare current metrics against the same period last year (`useYoyComparison`, `VisitorChart`).
- **Previous Period Comparison**: Compare current metrics to the prior equivalent period.
- **Campaign Builder**: Built-in tool for standardizing UTM parameters (`CampaignBuilder`).
- **Annotations**: Add notes to specific dates for context on traffic changes (`AnnotationsCard`, `useAnnotations`).
- **Data Export**: Export analytics data in multiple formats (`ExportButton`, `DataExport`).
- **Automated Email Digests**: Weekly HTML reports with top metrics, pages, and referrers (`email-digest` edge function).
- **Slack Notifications**: Real-time alerts and scheduled digests (`SlackIntegrationCard`, `slack-notify`).
- **Discord Notifications**: Webhook-based alerts and digests (`ChatIntegrationsCard`, `chat-notify`).
- **Custom Alerts**: Configurable metric-based alerts with email/Slack/Discord channels (`AlertsManager`, `check-alerts`).

### Platform & Settings
- **Custom Dashboards**: Build personalized dashboard layouts (`CustomDashboardsCard`, `useCustomDashboards`).
- **Team Management**: Invite team members and manage roles (`TeamCard`, `useTeam`).
- **API Keys**: Programmatic access to analytics data (`ApiKeysCard`, `useApiKeys`, `public-api`).
- **Two-Factor Auth**: TOTP-based 2FA with backup codes (`TwoFactorSetup`, `BackupCodes`).
- **SSO / SAML**: Enterprise single sign-on support (`SSOConfigCard`, `sso-saml`).
- **Embed Widget**: Embed analytics snippets into external dashboards (`EmbedWidgetCard`, `embed-widget`).
- **Short Links**: Branded short URL tracking (`Links`, `LinksStats`, `redirect`).
- **White Labeling**: Custom branding for self-hosted instances (`WhiteLabelingCard`).
- **Webhook Integration**: Push analytics events to external endpoints (`WebhookIntegrationCard`, `useWebhookIntegration`).
- **Tag Manager**: Manage tracking tags without code changes (`TagManagerCard`).
- **Tracking Tiers**: Choose between Lite, Standard, and Full tracking modes (`TrackingTierSelector`).
- **Login History & Session Management**: View login history and manage active sessions (`LoginHistory`, `SessionManagement`).
- **Data Import**: Import data from Google Analytics and server logs (`DataImport`, `LogImportCard`, `GAImportWizard`, `import-data`).
- **Billing & Usage**: Usage tracking with plan limits and upgrade prompts (`UsageCard`, `UsageAlert`, `PlanCard`).

## 🚀 Getting Started

### Quick Start (Cloud)

1. Visit [mmmetric.lovable.app](https://mmmetric.lovable.app) and sign up.
2. Add your first website.
3. Configure your tracking preferences (Lite, Standard, Full).
4. Copy the appropriate tracking script to your site's `<head>`.
5. *Note: The Free tier retains data for 30 days. Consider upgrading for extended retention.*

### Self-Hosting

mmmetric can be fully self-hosted using Supabase as the backend. No vendor lock-in — Supabase itself can also be [self-hosted](https://supabase.com/docs/guides/self-hosting).

#### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) account (free tier works) or self-hosted Supabase instance

#### Installation

```bash
# Clone the repository
git clone https://github.com/dailydimaz/mmmetric.git
cd mmmetric

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Configure your Supabase credentials in .env (see Environment Variables below)

# Run database migrations
# Apply the SQL files in supabase/migrations/ to your Supabase project
# via the Supabase dashboard SQL editor or CLI

# Start development server
npm run dev
```

#### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | ✅ | Your Supabase instance URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | ✅ | Supabase anon/public key |
| `VITE_SUPABASE_PROJECT_ID` | Optional | Project ID (derived from URL if omitted) |
| `VITE_APP_URL` | Optional | Your app URL (defaults to `window.location.origin`) |
| `VITE_APP_NAME` | Optional | Custom branding name (defaults to "mmmetric") |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Optional | **Leave empty** for self-hosted (unlocks all features) |

#### Edge Function Secrets

Configure these in your Supabase dashboard under **Edge Functions → Secrets** or via CLI:

```bash
supabase secrets set RESEND_API_KEY=your-resend-key
supabase secrets set APP_URL=https://analytics.yourdomain.com
supabase secrets set APP_NAME=YourAnalytics
supabase secrets set EMAIL_FROM="Analytics <reports@yourdomain.com>"
supabase secrets set CRON_SECRET=your-random-secret
supabase secrets set ALLOWED_DEV_ORIGINS=localhost,staging.yourdomain.com
```

#### Production Deployment

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

Deploy the `dist/` folder to any static hosting provider like Vercel, Netlify, Cloudflare Pages, or GitHub Pages.

#### GeoIP Setup (Optional)

For visitor geolocation, mmmetric uses a self-hosted IP database to avoid external rate limits and preserve complete privacy. See [docs/geoip-import.md](docs/geoip-import.md) to import data from DB-IP Lite or MaxMind GeoLite2.

## 📊 Usage

### Tracking Script Variants

mmmetric offers multiple tracking scripts depending on your needs. Add the chosen script to your website's `<head>` tag. **The `data-api` attribute should point to your Supabase Edge Functions URL.**

**1. Standard Tracker (Recommended)**
Tracks pageviews, unique visitors, sessions, outbound links, and file downloads.
```html
<script defer 
  src="https://your-analytics-domain.com/track.js" 
  data-site="YOUR_TRACKING_ID"
  data-api="https://your-supabase-url.supabase.co/functions/v1/track">
</script>
```

**2. Full Tracker (Web Vitals & Forms)**
Includes Core Web Vitals performance tracking, automatic Form Analytics, and error monitoring.
```html
<script defer 
  src="https://your-analytics-domain.com/track-full.js" 
  data-site="YOUR_TRACKING_ID"
  data-api="https://your-supabase-url.supabase.co/functions/v1/track">
</script>
```

**3. Lite Tracker**
Ultra-minimal: pageviews, sessions, referrer, SPA support, and custom events only.
```html
<script defer 
  src="https://your-analytics-domain.com/track-lite.js" 
  data-site="YOUR_TRACKING_ID"
  data-api="https://your-supabase-url.supabase.co/functions/v1/track">
</script>
```

### Script Configuration Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `data-site` | Required | Your site tracking ID |
| `data-api` | Auto-detected | Tracking API endpoint |
| `data-auto-track` | `true` | Auto-track pageviews |
| `data-domains` | All | Comma-separated allowed domains |
| `data-do-not-track` | `false` | Respect browser DNT setting |
| `data-exclude-search` | `false` | Strip query strings from URLs |
| `data-exclude-hash` | `false` | Strip hash fragments from URLs |
| `data-tag` | None | Global tag applied to all events |

### Tracking Custom Events

```javascript
// Track a custom event
mmmetric.track('button_click', { button_id: 'cta-hero' });

// Track a form submission manually
mmmetric.track('form_submit', { form_name: 'newsletter' });

// Identify a user (optional, privacy-respecting)
mmmetric.identify('user-123', { plan: 'pro' });
mmmetric.identify({ plan: 'pro' }); // Without custom ID
```

### Tracking Pixel (Email/No-JS)

For environments without JavaScript (like email newsletters):

```html
<img src="https://your-supabase-url.supabase.co/functions/v1/pixel?site_id=YOUR_TRACKING_ID" alt="" />
```

## 🔌 Integrations

- **Google Analytics Import**: Migrate historical metrics from Universal Analytics and GA4 (`GAImportWizard`).
- **Google Search Console**: Built-in dashboard for GSC SEO metrics (`GSCDashboard`).
- **Shopify**: Connect and sync Shopify store analytics (`ShopifyConnectDialog`, `shopify-connect`, `shopify-sync`).
- **Slack**: Real-time notifications and scheduled digests (`SlackIntegrationCard`, `slack-notify`).
- **Discord**: Webhook-based alerts (`ChatIntegrationsCard`, `chat-notify`, `send-chat-digest`).
- **Looker Studio**: Connect analytics data to Looker Studio dashboards (`LookerStudioCard`).
- **Webhooks**: Push events to any HTTP endpoint (`WebhookIntegrationCard`).
- **Mobile SDKs**: Support for tracking mobile applications (`MobileSDKs`).
- **Public API**: RESTful API for programmatic access (`public-api`, `ApiKeysCard`).
- **Embed Widget**: Embeddable analytics snippets for external dashboards (`EmbedWidgetCard`, `embed-widget`).

## 🏗️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS v4, shadcn/ui, Framer Motion
- **Charts**: Recharts, D3 (geo), react-simple-maps, pigeon-maps
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions + Storage)
- **State Management**: TanStack Query
- **Routing**: React Router v6

## 📁 Project Structure

```
src/
├── assets/              # Static assets (logo, images)
├── components/
│   ├── analytics/       # All analytics widgets (50+ components)
│   ├── auth/            # Authentication components
│   ├── billing/         # Plan, usage, and upgrade components
│   ├── dashboard/       # Dashboard layout and navigation
│   ├── integrations/    # Third-party integration UIs
│   ├── landing/         # Marketing/landing page components
│   ├── links/           # Short link management
│   ├── migration/       # Data migration wizards
│   ├── onboarding/      # New user onboarding flow
│   ├── sessions/        # Session management
│   ├── settings/        # All settings panels (24 components)
│   ├── site-detail/     # Site-specific analytics layout
│   └── ui/              # shadcn/ui primitives
├── hooks/               # 50+ custom React hooks
├── lib/                 # Utilities and config
├── pages/               # 40+ route pages
├── tracker/             # Client-side tracking scripts (Lite, Standard, Full)
│   └── overlay.tsx      # Page overlay renderer
└── integrations/        # Supabase client and types

supabase/
├── functions/           # 20+ Edge Functions
│   ├── track/           # Event ingestion endpoint
│   ├── pixel/           # Tracking pixel for no-JS
│   ├── email-digest/    # Weekly email reports
│   ├── check-alerts/    # Alert evaluation
│   ├── public-api/      # REST API
│   ├── session-recording/ # Recording playback
│   └── ...              # slack-notify, chat-notify, sso-saml, etc.
├── migrations/          # Database migrations
└── config.toml          # Supabase configuration

docs/
└── geoip-import.md      # GeoIP database setup guide
```

## 🤝 Contributing

We love contributions! Please read our [Contributing Guide](CONTRIBUTING.md) to get started. Run `npm run dev` to boot the application locally.

## 📄 License

mmmetric is open-source software licensed under the [MIT License](LICENSE).

---

<p align="center">
  Made with ❤️ for privacy
</p>
