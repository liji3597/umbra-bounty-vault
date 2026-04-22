import type { ReactNode } from 'react';

import { Providers } from './Providers';

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  return <Providers>{children}</Providers>;
}
