import type { HTMLAttributes, ReactNode } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  variant?: 'default' | 'accent';
}

function getBadgeClassName(variant: BadgeProps['variant'], className?: string): string {
  const variantClassName = variant === 'accent' ? 'ui-badge--accent' : 'ui-badge--default';
  const baseClassName = `ui-badge ${variantClassName}`;

  return className ? `${baseClassName} ${className}` : baseClassName;
}

export function Badge({ children, className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span className={getBadgeClassName(variant, className)} {...props}>
      {children}
    </span>
  );
}
