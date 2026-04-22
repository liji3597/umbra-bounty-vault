import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/claim/components/ClaimCenterPageContainer', () => ({
  ClaimCenterPageContainer: () => <div>Injected claim center container</div>,
}));

import ClaimCenterRoute from './page';

describe('ClaimCenterPage route', () => {
  it('renders the client claim center container', () => {
    render(<ClaimCenterRoute />);

    expect(screen.getByText('Injected claim center container')).toBeInTheDocument();
  });
});
