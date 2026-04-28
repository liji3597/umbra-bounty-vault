import type { Metadata } from 'next';

import { MarketingLandingPage } from '@/components/marketing/MarketingLandingPage';
import { MARKETING_ROUTE, createRouteMetadata } from '@/lib/routes';

export const metadata: Metadata = createRouteMetadata(MARKETING_ROUTE);

export default function MarketingHomePage() {
  return <MarketingLandingPage />;
}
