export interface AppRoute {
  href: string;
  label: string;
  title: string;
  description: string;
}

export interface RouteMetadata {
  title: string;
  description: string;
}

export const MARKETING_ROUTE: AppRoute = {
  href: '/',
  label: 'Landing',
  title: 'Umbra Bounty Vault',
  description:
    'Privacy-first reward workflow for private payouts, claims, and controlled disclosure.',
};

export const APP_NAV_ROUTES: AppRoute[] = [
  {
    href: '/app/dashboard',
    label: 'Dashboard',
    title: 'Dashboard',
    description: 'Track private payout progress and reward lifecycle status.',
  },
  {
    href: '/app/payouts/new',
    label: 'Create Payout',
    title: 'Create Payout',
    description: 'Prepare a private payout with typed workflow inputs.',
  },
  {
    href: '/app/claim',
    label: 'Claim Center',
    title: 'Claim Center',
    description: 'Discover and claim eligible private rewards.',
  },
  {
    href: '/app/disclosure',
    label: 'Disclosure',
    title: 'Disclosure / Verification',
    description: 'Review controlled disclosure views when verification is needed.',
  },
  {
    href: '/app/activity',
    label: 'Activity',
    title: 'Activity',
    description: 'Follow payout creation, claim progress, and disclosure events.',
  },
];

export function createRouteMetadata(route: AppRoute): RouteMetadata {
  return {
    title: route.title,
    description: route.description,
  };
}

export function getAppRoute(href: string): AppRoute {
  const route = APP_NAV_ROUTES.find((candidate) => candidate.href === href);

  if (!route) {
    throw new Error(`Missing app route definition for ${href}`);
  }

  return route;
}
