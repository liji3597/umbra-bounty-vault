import type { Metadata } from 'next';

import { ActivityPageContainer } from '@/features/activity/ActivityPageContainer';
import { createRouteMetadata, getAppRoute } from '@/lib/routes';

const route = getAppRoute('/app/activity');

export const metadata: Metadata = createRouteMetadata(route);

export default function ActivityRoute() {
  return <ActivityPageContainer />;
}
