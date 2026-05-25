'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/sidebar';
import { UpgradeModal } from '@/components/dashboard/upgrade-modal';
import { fetchWorkspaceDetails } from '@/lib/api';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const slug = params.slug as string;
  const [tier, setTier] = useState('pro');
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  useEffect(() => {
    fetchWorkspaceDetails(slug).then((data) => {
      if (data?.workspace?.tier) setTier(data.workspace.tier);
    });
  }, [slug]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar slug={slug} tier={tier} onUpgrade={() => setUpgradeOpen(true)} />
      <main className="flex-1 overflow-y-auto bg-navy-950 p-8">
        {children}
      </main>
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </div>
  );
}
