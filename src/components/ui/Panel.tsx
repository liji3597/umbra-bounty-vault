import type { HTMLAttributes, ReactNode } from 'react';

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  heading?: string;
  description?: string;
  children?: ReactNode;
}

function getPanelClassName(className?: string): string {
  return className ? `ui-panel ${className}` : 'ui-panel';
}

export function Panel({
  heading,
  description,
  children,
  className,
  ...props
}: PanelProps) {
  return (
    <div className={getPanelClassName(className)} {...props}>
      {heading ? <p className="ui-panel__title">{heading}</p> : null}
      {description ? <p className="ui-panel__description">{description}</p> : null}
      {children}
    </div>
  );
}
