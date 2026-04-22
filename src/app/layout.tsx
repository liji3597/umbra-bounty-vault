import type { Metadata } from 'next';
import { Manrope, Newsreader } from 'next/font/google';
import type { ReactNode } from 'react';

import { MARKETING_ROUTE, createRouteMetadata } from '@/lib/routes';

import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-manrope',
});

const newsreader = Newsreader({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-newsreader',
});

export const metadata: Metadata = createRouteMetadata(MARKETING_ROUTE);

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={`${manrope.variable} ${newsreader.variable}`}>
      <body>{children}</body>
    </html>
  );
}
