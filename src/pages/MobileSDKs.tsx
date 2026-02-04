import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Smartphone, Copy, Check, Apple, Play, Code2, Terminal, Zap, Shield, Wifi, Battery } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSupabaseFunctionsUrl } from "@/lib/config";

export default function MobileSDKs() {
    const [copiedSection, setCopiedSection] = useState<string | null>(null);
    const trackingApiUrl = getSupabaseFunctionsUrl() + "/track";

    const copyToClipboard = async (text: string, section: string) => {
        await navigator.clipboard.writeText(text);
        setCopiedSection(section);
        setTimeout(() => setCopiedSection(null), 2000);
    };

    const CopyButton = ({ text, section }: { text: string; section: string }) => (
        <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 absolute top-2 right-2"
            onClick={() => copyToClipboard(text, section)}
        >
            {copiedSection === section ? (
                <Check className="h-4 w-4 text-green-500" />
            ) : (
                <Copy className="h-4 w-4" />
            )}
        </Button>
    );

    const reactNativeInstall = `npm install @mmmetric/react-native-sdk
# or
yarn add @mmmetric/react-native-sdk`;

    const reactNativeInit = `// App.tsx or index.tsx
import { MMMetric } from '@mmmetric/react-native-sdk';

// Initialize the SDK
MMMetric.init({
  siteId: 'YOUR_TRACKING_ID',
  apiUrl: '${trackingApiUrl}',
  // Optional configuration
  debug: __DEV__,
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
  enableAutoTracking: true,
});`;

    const reactNativeTrackScreen = `import { useEffect } from 'react';
import { MMMetric } from '@mmmetric/react-native-sdk';

function HomeScreen() {
  useEffect(() => {
    // Track screen view
    MMMetric.trackScreen('Home');
  }, []);

  return (
    // Your component
  );
}

// Or use the hook for automatic tracking
import { useMMMetricScreen } from '@mmmetric/react-native-sdk';

function ProfileScreen() {
  useMMMetricScreen('Profile');
  
  return (
    // Your component
  );
}`;

    const reactNativeEvents = `import { MMMetric } from '@mmmetric/react-native-sdk';

// Track custom events
MMMetric.track('button_click', {
  button_name: 'signup',
  screen: 'onboarding',
});

// Track purchases
MMMetric.track('purchase', {
  product_id: 'premium_monthly',
  price: 9.99,
  currency: 'USD',
});

// Track user properties
MMMetric.setUserProperties({
  plan: 'premium',
  signup_date: '2024-01-15',
});

// Identify users (after login)
MMMetric.identify('user_123');`;

    const reactNativeNavigation = `// React Navigation integration
import { NavigationContainer } from '@react-navigation/native';
import { MMMetric } from '@mmmetric/react-native-sdk';

function App() {
  const routeNameRef = useRef<string>();
  const navigationRef = useNavigationContainerRef();

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        routeNameRef.current = navigationRef.getCurrentRoute()?.name;
      }}
      onStateChange={() => {
        const previousRouteName = routeNameRef.current;
        const currentRouteName = navigationRef.getCurrentRoute()?.name;

        if (previousRouteName !== currentRouteName && currentRouteName) {
          MMMetric.trackScreen(currentRouteName);
        }
        routeNameRef.current = currentRouteName;
      }}
    >
      {/* Your app */}
    </NavigationContainer>
  );
}`;

    const flutterInstall = `# pubspec.yaml
dependencies:
  mmmetric_flutter: ^1.0.0

# Then run:
flutter pub get`;

    const flutterInit = `// main.dart
import 'package:mmmetric_flutter/mmmetric_flutter.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  await MMMetric.init(
    siteId: 'YOUR_TRACKING_ID',
    apiUrl: '${trackingApiUrl}',
    config: MMMetricConfig(
      debug: kDebugMode,
      sessionTimeout: Duration(minutes: 30),
      enableAutoTracking: true,
    ),
  );
  
  runApp(MyApp());
}`;

    const flutterTrackScreen = `import 'package:mmmetric_flutter/mmmetric_flutter.dart';

// Track screen views manually
class HomeScreen extends StatefulWidget {
  @override
  _HomeScreenState createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();
    MMMetric.trackScreen('Home');
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      // Your widget
    );
  }
}

// Or use the observer for automatic tracking
class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      navigatorObservers: [
        MMMetricNavigatorObserver(),
      ],
      // Your app
    );
  }
}`;

    const flutterEvents = `import 'package:mmmetric_flutter/mmmetric_flutter.dart';

// Track custom events
await MMMetric.track('button_click', properties: {
  'button_name': 'signup',
  'screen': 'onboarding',
});

// Track purchases
await MMMetric.track('purchase', properties: {
  'product_id': 'premium_monthly',
  'price': 9.99,
  'currency': 'USD',
});

// Track user properties
await MMMetric.setUserProperties({
  'plan': 'premium',
  'signup_date': '2024-01-15',
});

// Identify users (after login)
await MMMetric.identify('user_123');`;

    const flutterAdvanced = `// Offline support - events are queued when offline
MMMetric.enableOfflineMode(true);

// Flush events manually
await MMMetric.flush();

// Reset user session (on logout)
await MMMetric.reset();

// Custom session management
await MMMetric.startSession();
await MMMetric.endSession();

// Attribution tracking
await MMMetric.trackAttribution(
  source: 'google_ads',
  medium: 'cpc',
  campaign: 'summer_sale',
);`;

    const httpApiExample = `// Direct HTTP API (works with any platform)
const trackEvent = async (eventName, properties = {}) => {
  const response = await fetch('${trackingApiUrl}', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      site_id: 'YOUR_TRACKING_ID',
      event_name: eventName,
      url: '/mobile/screen_name',
      session_id: getOrCreateSessionId(),
      visitor_id: getDeviceId(),
      properties: {
        ...properties,
        platform: Platform.OS,
        app_version: '1.0.0',
      },
    }),
  });
  return response.ok;
};

// Usage
trackEvent('pageview', { screen: 'Home' });
trackEvent('button_click', { button: 'signup' });`;

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div className="flex items-center gap-2">
                            <Smartphone className="h-6 w-6 text-primary" />
                            <h1 className="text-xl font-bold">Mobile SDKs</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="gap-1">
                            <Apple className="h-3 w-3" />
                            iOS
                        </Badge>
                        <Badge variant="secondary" className="gap-1">
                            <Play className="h-3 w-3" />
                            Android
                        </Badge>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-5xl">
                {/* Hero Section */}
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold tracking-tight mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                        Mobile Analytics SDKs
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Lightweight, privacy-focused analytics for your React Native and Flutter applications.
                        Track screen views, events, and user journeys without compromising performance.
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                    <Card className="text-center p-4">
                        <Zap className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                        <h3 className="font-semibold text-sm">Lightweight</h3>
                        <p className="text-xs text-muted-foreground">&lt;10KB gzipped</p>
                    </Card>
                    <Card className="text-center p-4">
                        <Shield className="h-8 w-8 mx-auto mb-2 text-green-500" />
                        <h3 className="font-semibold text-sm">Privacy-First</h3>
                        <p className="text-xs text-muted-foreground">No PII collected</p>
                    </Card>
                    <Card className="text-center p-4">
                        <Wifi className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                        <h3 className="font-semibold text-sm">Offline Support</h3>
                        <p className="text-xs text-muted-foreground">Queues events</p>
                    </Card>
                    <Card className="text-center p-4">
                        <Battery className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                        <h3 className="font-semibold text-sm">Battery Friendly</h3>
                        <p className="text-xs text-muted-foreground">Batched requests</p>
                    </Card>
                </div>

                {/* SDK Tabs */}
                <Tabs defaultValue="react-native" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="react-native" className="gap-2">
                            <Code2 className="h-4 w-4" />
                            React Native
                        </TabsTrigger>
                        <TabsTrigger value="flutter" className="gap-2">
                            <Code2 className="h-4 w-4" />
                            Flutter
                        </TabsTrigger>
                        <TabsTrigger value="http-api" className="gap-2">
                            <Terminal className="h-4 w-4" />
                            HTTP API
                        </TabsTrigger>
                    </TabsList>

                    {/* React Native Tab */}
                    <TabsContent value="react-native" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Terminal className="h-5 w-5" />
                                    Installation
                                </CardTitle>
                                <CardDescription>
                                    Install the React Native SDK using npm or yarn
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="relative">
                                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                                        <code>{reactNativeInstall}</code>
                                    </pre>
                                    <CopyButton text={reactNativeInstall} section="rn-install" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Initialization</CardTitle>
                                <CardDescription>
                                    Initialize the SDK in your app's entry point
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="relative">
                                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                                        <code>{reactNativeInit}</code>
                                    </pre>
                                    <CopyButton text={reactNativeInit} section="rn-init" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Screen Tracking</CardTitle>
                                <CardDescription>
                                    Track screen views in your app
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="relative">
                                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                                        <code>{reactNativeTrackScreen}</code>
                                    </pre>
                                    <CopyButton text={reactNativeTrackScreen} section="rn-screen" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Event Tracking</CardTitle>
                                <CardDescription>
                                    Track custom events and user actions
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="relative">
                                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                                        <code>{reactNativeEvents}</code>
                                    </pre>
                                    <CopyButton text={reactNativeEvents} section="rn-events" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>React Navigation Integration</CardTitle>
                                <CardDescription>
                                    Automatic screen tracking with React Navigation
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="relative">
                                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                                        <code>{reactNativeNavigation}</code>
                                    </pre>
                                    <CopyButton text={reactNativeNavigation} section="rn-nav" />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Flutter Tab */}
                    <TabsContent value="flutter" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Terminal className="h-5 w-5" />
                                    Installation
                                </CardTitle>
                                <CardDescription>
                                    Add the Flutter SDK to your pubspec.yaml
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="relative">
                                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                                        <code>{flutterInstall}</code>
                                    </pre>
                                    <CopyButton text={flutterInstall} section="flutter-install" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Initialization</CardTitle>
                                <CardDescription>
                                    Initialize the SDK in your main.dart file
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="relative">
                                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                                        <code>{flutterInit}</code>
                                    </pre>
                                    <CopyButton text={flutterInit} section="flutter-init" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Screen Tracking</CardTitle>
                                <CardDescription>
                                    Track screen views with manual or automatic tracking
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="relative">
                                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                                        <code>{flutterTrackScreen}</code>
                                    </pre>
                                    <CopyButton text={flutterTrackScreen} section="flutter-screen" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Event Tracking</CardTitle>
                                <CardDescription>
                                    Track custom events and user properties
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="relative">
                                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                                        <code>{flutterEvents}</code>
                                    </pre>
                                    <CopyButton text={flutterEvents} section="flutter-events" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Advanced Features</CardTitle>
                                <CardDescription>
                                    Offline support, session management, and attribution
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="relative">
                                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                                        <code>{flutterAdvanced}</code>
                                    </pre>
                                    <CopyButton text={flutterAdvanced} section="flutter-advanced" />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* HTTP API Tab */}
                    <TabsContent value="http-api" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Terminal className="h-5 w-5" />
                                    Direct HTTP API
                                </CardTitle>
                                <CardDescription>
                                    Use the tracking API directly from any platform
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    If you prefer not to use an SDK or need to integrate with a different platform,
                                    you can send events directly to our tracking API.
                                </p>
                                <div className="relative">
                                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                                        <code>{httpApiExample}</code>
                                    </pre>
                                    <CopyButton text={httpApiExample} section="http-api" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>API Reference</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="font-semibold mb-2">Endpoint</h4>
                                        <code className="bg-muted px-2 py-1 rounded text-sm">POST {trackingApiUrl}</code>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold mb-2">Request Body</h4>
                                        <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
                                            <div><code className="text-primary">site_id</code> <span className="text-muted-foreground">- Your tracking ID (required)</span></div>
                                            <div><code className="text-primary">event_name</code> <span className="text-muted-foreground">- Event type: "pageview", "custom", etc. (required)</span></div>
                                            <div><code className="text-primary">url</code> <span className="text-muted-foreground">- Screen or page path (required)</span></div>
                                            <div><code className="text-primary">session_id</code> <span className="text-muted-foreground">- Unique session identifier</span></div>
                                            <div><code className="text-primary">visitor_id</code> <span className="text-muted-foreground">- Anonymous device identifier</span></div>
                                            <div><code className="text-primary">properties</code> <span className="text-muted-foreground">- Custom event properties (object)</span></div>
                                            <div><code className="text-primary">referrer</code> <span className="text-muted-foreground">- Previous screen/source</span></div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Bottom CTA */}
                <div className="mt-12 text-center p-8 bg-muted/50 rounded-xl border border-border">
                    <h3 className="text-xl font-semibold mb-2">Ready to get started?</h3>
                    <p className="text-muted-foreground mb-4">
                        Create a site in your dashboard and use the tracking ID with any SDK above.
                    </p>
                    <div className="flex justify-center gap-4">
                        <Link to="/dashboard">
                            <Button>Go to Dashboard</Button>
                        </Link>
                        <Link to="/roadmap">
                            <Button variant="outline">View Roadmap</Button>
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
