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

mmmetric goes beyond basic page views to provide a comprehensive, privacy-respecting analytics suite:

### Core Analytics
- **Privacy-First & Cookie-less**: No personal data collection. Fully GDPR/CCPA compliant out of the box.
- **Real-time Engine**: Watch visitors interact with your site as it happens.
- **Lightweight Tracker**: < 1KB standard script with zero impact on Core Web Vitals.
- **Multi-Site Management**: Group and manage multiple domains under unified dashboards.
- **Localization**: Built-in support for multiple languages (EN, ID, TH, VI, MY, PH).

### Advanced Behavior & Conversion
- **Session Recordings**: Visual playback of user interactions and navigation paths.
- **A/B Testing & Experiments**: Built-in experiment management and statistical reporting.
- **Page Overlays & Heatmaps**: Visual analytics laid directly over your website UI.
- **Funnel & Journey Analysis**: Understand conversion funnels and multi-step user paths.
- **Retention Cohorts**: Track user engagement and retention over time.
- **Custom Event Tracking**: Track button clicks, form submissions, and unique conversions.

### Diagnostics & Attribution
- **Multi-Touch Attribution**: Track user sources and campaign effectiveness.
- **Campaign Builder**: Built-in tool for standardizing UTM parameters.
- **Site Search Analytics**: Analyze internal search queries on your platform.
- **Error Tracking**: Client-side Javascript error reporting and logging.
- **Social Share Tracking**: Measure content virality and sharing metrics.

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
Tracks pageviews, unique visitors, and sessions.
```html
<script defer 
  src="https://your-analytics-domain.com/track.js" 
  data-site="YOUR_TRACKING_ID"
  data-api="https://your-supabase-url.supabase.co/functions/v1/track">
</script>
```

**2. Full Tracker (Web Vitals & Forms)**
Includes Core Web Vitals performance tracking and automatic Form Analytics.
```html
<script defer 
  src="https://your-analytics-domain.com/track-full.js" 
  data-site="YOUR_TRACKING_ID"
  data-api="https://your-supabase-url.supabase.co/functions/v1/track">
</script>
```

**3. Lite Tracker**
A stripped-down version for absolute minimal payload size.
```html
<script defer 
  src="https://your-analytics-domain.com/track-lite.js" 
  data-site="YOUR_TRACKING_ID"
  data-api="https://your-supabase-url.supabase.co/functions/v1/track">
</script>
```

### Tracking Custom Events

```javascript
// Track a custom event
mmmetric.track('button_click', { button_id: 'cta-hero' });

// Track a form submission manually
mmmetric.track('form_submit', { form_name: 'newsletter' });
```

### Tracking Pixel (Email/No-JS)

For environments without JavaScript (like email newsletters):

```html
<img src="https://your-supabase-url.supabase.co/functions/v1/pixel?site_id=YOUR_TRACKING_ID" alt="" />
```

## 🔌 Integrations

mmmetric is designed to integrate cleanly with your existing ecosystem natively:
- **Google Analytics Import Wizards:** Migrate historical metrics seamlessly from Universal Analytics and GA4 directly into mmmetric via `src/pages/GAImportWizard.tsx`.
- **Google Search Console:** Built-in dashboard to pull and display your GSC SEO metrics alongside your web analytics.
- **Mobile SDKs:** Support for tracking mobile applications (consult `src/pages/MobileSDKs.tsx` for platform status).

## 🏗️ Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Styling**: Tailwind CSS v4, shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **State Management**: TanStack Query

## 🤝 Contributing

We love contributions! Please read our [Contributing Guide](CONTRIBUTING.md) to get started. Run `npm run dev` to boot the application locally.

## 📄 License

mmmetric is open-source software licensed under the [MIT License](LICENSE).

---

<p align="center">
  Made with ❤️ for privacy
</p>
