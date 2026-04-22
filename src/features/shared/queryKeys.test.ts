import { describe, expect, it } from 'vitest';

import { queryKeys } from './queryKeys';

describe('queryKeys', () => {
  it('builds stable payout keys', () => {
    expect(queryKeys.payouts.all()).toEqual(['payouts']);
    expect(queryKeys.payouts.detail('payout-1')).toEqual(['payouts', 'detail', 'payout-1']);
    expect(queryKeys.payouts.status('payout-1')).toEqual(['payouts', 'status', 'payout-1']);
  });

  it('builds stable claim and disclosure keys', () => {
    expect(queryKeys.claims.all()).toEqual(['claims']);
    expect(queryKeys.claims.scan('wallet-1', 'devnet')).toEqual([
      'claims',
      'scan',
      'devnet',
      'wallet-1',
    ]);
    expect(queryKeys.disclosure.detail('payout-1')).toEqual([
      'disclosure',
      'detail',
      'payout-1',
    ]);
  });
});
