import type { Metadata } from 'next';

import { ClaimCenterPageContainer } from '@/features/claim/components/ClaimCenterPageContainer';
import { createRouteMetadata, getAppRoute } from '@/lib/routes';

const route = getAppRoute('/app/claim');

export const metadata: Metadata = createRouteMetadata(route);

export default function ClaimCenterRoute() {
  return <ClaimCenterPageContainer />;
}
