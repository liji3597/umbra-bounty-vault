import type { Metadata } from 'next';

import { CreatePayoutPageContainer } from '@/features/payout/components/CreatePayoutPageContainer';
import { createRouteMetadata, getAppRoute } from '@/lib/routes';

const route = getAppRoute('/app/payouts/new');

export const metadata: Metadata = createRouteMetadata(route);

export default function CreatePayoutPage() {
  return <CreatePayoutPageContainer />;
}
