import { describe, expect, it } from 'vitest';

import { APP_NAV_ROUTES, MARKETING_ROUTE, createRouteMetadata } from './routes';

describe('routes', () => {
  it('registers the landing route', () => {
    expect(MARKETING_ROUTE).toMatchObject({
      href: '/',
      label: 'Landing',
      title: 'Umbra Bounty Vault',
    });
  });

  it('creates metadata from the marketing route', () => {
    expect(createRouteMetadata(MARKETING_ROUTE)).toEqual({
      title: MARKETING_ROUTE.title,
      description: MARKETING_ROUTE.description,
    });
  });

  it.each([
    ['/app/dashboard', 'Dashboard'],
    ['/app/payouts/new', 'Create Payout'],
    ['/app/claim', 'Claim Center'],
    ['/app/disclosure', 'Disclosure / Verification'],
    ['/app/activity', 'Activity'],
  ])('registers %s as %s', (href, title) => {
    expect(APP_NAV_ROUTES).toContainEqual(
      expect.objectContaining({
        href,
        title,
      }),
    );
  });
});
