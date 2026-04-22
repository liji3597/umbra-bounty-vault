import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Panel } from './Panel';

describe('Panel', () => {
  it('renders heading, description, and children', () => {
    render(
      <Panel description="Placeholder surface ready for feature implementation." heading="Current phase">
        <p>P2 App Shell & Infrastructure</p>
      </Panel>,
    );

    expect(screen.getByText('Current phase')).toBeInTheDocument();
    expect(
      screen.getByText('Placeholder surface ready for feature implementation.'),
    ).toBeInTheDocument();
    expect(screen.getByText('P2 App Shell & Infrastructure')).toBeInTheDocument();
  });

  it('forwards native title attribute to the root element', () => {
    const { container } = render(<Panel title="Panel tooltip">Content</Panel>);

    expect(container.firstElementChild).toHaveAttribute('title', 'Panel tooltip');
  });

  it('merges custom class names', () => {
    const { container } = render(<Panel className="custom-panel">Content</Panel>);

    expect(container.firstElementChild).toHaveClass('ui-panel', 'custom-panel');
  });
});
