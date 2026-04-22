import type { Metadata } from 'next';

import { LandingPlaceholder } from '@/components/layout/PlaceholderPage';
import { MARKETING_ROUTE, createRouteMetadata } from '@/lib/routes';

export const metadata: Metadata = createRouteMetadata(MARKETING_ROUTE);

export default function MarketingHomePage() {
  return <LandingPlaceholder />;
}
