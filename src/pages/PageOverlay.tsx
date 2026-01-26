import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function PageOverlay() {
    const bookmarklet = `javascript:(function(){
    var s=document.createElement('script');
    s.src='https://your-instance.com/overlay.js?cb='+Date.now();
    document.body.appendChild(s);
  })();`;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Page Overlay</h1>
                <p className="text-muted-foreground">View analytics directly on your live website.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Bookmarklet</CardTitle>
                    <CardDescription>Drag this button to your bookmarks bar, then click it while viewing your site.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex justify-center py-8">
                        <a
                            href={bookmarklet}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                            onClick={e => e.preventDefault()}
                            title="Drag me to bookmarks"
                        >
                            mmmetric Overlay
                        </a>
                    </div>

                    <div className="space-y-2">
                        <p className="text-sm font-medium">Or copy the code:</p>
                        <Textarea readOnly value={bookmarklet} className="font-mono text-xs" rows={4} />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
