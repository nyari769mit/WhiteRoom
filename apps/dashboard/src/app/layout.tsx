import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { Analytics } from '@/components/analytics';
import './globals.css';

export const metadata: Metadata = {
  title: 'WhiteRoom — Governance for AI Agent Fleets',
  description: 'Watch/rest cycles, handover compression, and audit trails for AI agents. Ship faster without burning tokens.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider appearance={{ baseTheme: dark }}>
      <html lang="en" className="dark">
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
            rel="stylesheet"
          />
        </head>
        <body className="bg-navy-950 text-navy-50 min-h-screen antialiased">
          {children}
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
