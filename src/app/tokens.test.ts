import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

function getAppDirectory(): string {
  if (import.meta.url.startsWith('file:')) {
    return dirname(fileURLToPath(import.meta.url));
  }

  return join(process.cwd(), 'src', 'app');
}

function readAppCssFile(fileName: 'tokens.css' | 'globals.css'): string {
  return readFileSync(join(getAppDirectory(), fileName), 'utf8');
}

describe('design tokens', () => {
  it('defines the minimum shared token contract', () => {
    const tokensCss = readAppCssFile('tokens.css');

    expect(tokensCss).toContain('--color-background');
    expect(tokensCss).toContain('--color-foreground');
    expect(tokensCss).toContain('--color-surface');
    expect(tokensCss).toContain('--color-border');
    expect(tokensCss).toContain('--color-accent');
    expect(tokensCss).toContain('--color-accent-soft');
    expect(tokensCss).toContain('--color-accent-soft-hover');
    expect(tokensCss).toContain('--space-4');
    expect(tokensCss).toContain('--space-6');
    expect(tokensCss).toContain('--radius-xl');
    expect(tokensCss).toContain('--blur-surface');
    expect(tokensCss).toContain('--motion-duration-fast');
  });

  it('imports tokens into global styles instead of redefining root colors', () => {
    const globalsCss = readAppCssFile('globals.css');

    expect(globalsCss).toContain("@import './tokens.css';");
    expect(globalsCss).not.toContain('--color-background:');
    expect(globalsCss).not.toContain('--color-foreground:');
    expect(globalsCss).not.toContain('--color-accent:');
  });

  it('applies shared tokens in primitives and shell styles', () => {
    const globalsCss = readAppCssFile('globals.css');

    expect(globalsCss).toContain('background: var(--color-surface-low);');
    expect(globalsCss).toContain('background: rgba(35, 52, 113, 0.09);');
    expect(globalsCss).toContain('background: rgba(35, 52, 113, 0.14);');
    expect(globalsCss).toContain('background: var(--color-surface-inverse);');
    expect(globalsCss).toContain('font-family: var(--font-serif);');
  });
});
