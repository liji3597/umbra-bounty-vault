import type { ReactNode } from 'react';

import { AppShell } from '@/components/layout/AppShell';
import { AppProvider } from '@/providers/AppProvider';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <AppProvider>
      <AppShell>{children}</AppShell>
    </AppProvider>
  );
}
