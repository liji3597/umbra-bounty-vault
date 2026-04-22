import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/activity/ActivityPageContainer', () => ({
  ActivityPageContainer: () => <div>Injected activity container</div>,
}));

import ActivityRoute from './page';

describe('ActivityPage route', () => {
  it('renders the client activity container', () => {
    render(<ActivityRoute />);

    expect(screen.getByText('Injected activity container')).toBeInTheDocument();
  });
});
