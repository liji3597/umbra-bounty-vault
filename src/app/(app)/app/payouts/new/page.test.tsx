import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/payout/components/CreatePayoutPageContainer', () => ({
  CreatePayoutPageContainer: () => <div>Injected payout container</div>,
}));

import CreatePayoutPage from './page';

describe('CreatePayoutPage route', () => {
  it('renders the client container that injects payout submission wiring', () => {
    render(<CreatePayoutPage />);

    expect(screen.getByText('Injected payout container')).toBeInTheDocument();
  });
});
