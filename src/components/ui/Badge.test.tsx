import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Badge } from './Badge';

describe('Badge', () => {
  it('renders badge content', () => {
    render(<Badge>Private payout</Badge>);

    expect(screen.getByText('Private payout')).toBeInTheDocument();
  });

  it('supports accent variant', () => {
    render(<Badge variant="accent">Accent badge</Badge>);

    expect(screen.getByText('Accent badge')).toHaveClass('ui-badge--accent');
  });
});
