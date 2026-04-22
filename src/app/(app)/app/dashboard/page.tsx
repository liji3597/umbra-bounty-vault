import type { Metadata } from 'next';

import { DashboardPlaceholder } from '@/components/layout/PlaceholderPage';
import { createRouteMetadata, getAppRoute } from '@/lib/routes';

const route = getAppRoute('/app/dashboard');

export const metadata: Metadata = createRouteMetadata(route);

export default function DashboardPage() {
  return <DashboardPlaceholder />;
}
