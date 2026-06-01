import { useLocation } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { isAnalyticsEnabled } from "@/lib/analytics";

/**
 * Vercel Web Analytics + Speed Insights (production deploys only).
 * Passes the SPA pathname so vitals aggregate per route.
 */
export function VercelObservability() {
  const { pathname } = useLocation();

  if (!isAnalyticsEnabled()) return null;

  return (
    <>
      <Analytics />
      <SpeedInsights route={pathname} />
    </>
  );
}
