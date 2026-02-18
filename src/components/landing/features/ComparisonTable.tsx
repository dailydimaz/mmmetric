import { Badge } from "@/components/ui/badge";
import { PLANS } from "@/lib/billing";

const comparisonData = [
  {
    feature: "Data Ownership",
    mmmetric: "100% Yours",
    mmmetricHighlight: true,
    ga4: "Google's",
    ga4Bad: true,
    plausible: "Yours",
  },
  {
    feature: "Cookie Banner Required",
    mmmetric: "No (Privacy-first)",
    mmmetricHighlight: true,
    ga4: "Yes",
    ga4Bad: true,
    plausible: "No",
  },
  {
    feature: "Script Size",
    mmmetric: "< 1KB",
    mmmetricHighlight: true,
    ga4: "~45KB",
    ga4Bad: true,
    plausible: "~1KB",
  },
  {
    feature: "Event Tracking",
    mmmetric: "Unlimited Properties",
    mmmetricHighlight: true,
    ga4: "Complex",
    plausible: "Limited",
  },
  {
    feature: "Revenue Tracking",
    mmmetric: "Built-in",
    mmmetricHighlight: true,
    ga4: "Complex Setup",
    plausible: "Basic",
  },
  {
    feature: "Free Tier Retention",
    mmmetric: `${PLANS.free.retentionDays}-day`,
    mmmetricHighlight: true,
    ga4: "14 months",
    plausible: "Unlimited",
  },
  {
    feature: "Pricing",
    mmmetric: "Open Source / Free",
    mmmetricHighlight: true,
    ga4: "Free (Data Sold)",
    plausible: "$9/mo+",
  },
];

export function ComparisonTable() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4 md:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            Why switch?
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Better than the rest
          </h2>
          <p className="text-lg text-muted-foreground">
            See how mmmetric stacks up against the competition.
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-medium">Feature</th>
                <th className="px-6 py-4 font-bold text-primary">mmmetric</th>
                <th className="px-6 py-4 font-medium">Google Analytics 4</th>
                <th className="px-6 py-4 font-medium">Plausible</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {comparisonData.map((row) => (
                <tr key={row.feature} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-medium">{row.feature}</td>
                  <td className={`px-6 py-4 ${row.mmmetricHighlight ? "text-green-600 font-medium" : ""}`}>
                    {row.mmmetric}
                  </td>
                  <td className={`px-6 py-4 ${row.ga4Bad ? "text-red-500" : ""}`}>
                    {row.ga4}
                  </td>
                  <td className="px-6 py-4">{row.plausible}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
