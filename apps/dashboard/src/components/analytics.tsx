'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { initPostHog, posthog } from '@/lib/posthog';

export function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    initPostHog();
  }, []);

  useEffect(() => {
    posthog.capture('$pageview', { path: pathname });
  }, [pathname]);

  return null;
}
