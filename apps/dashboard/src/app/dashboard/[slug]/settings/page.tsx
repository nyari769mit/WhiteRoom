'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { fetchWorkspaceDetails } from '@/lib/api';
import { Settings } from 'lucide-react';

export default function SettingsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [workspace, setWorkspace] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    fetchWorkspaceDetails(slug).then((data) => {
      if (data?.workspace) setWorkspace(data.workspace);
    });
  }, [slug]);

  if (!workspace) return <div className="text-navy-400">Loading...</div>;

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-8">Settings</h1>

      <div className="rounded-xl bg-navy-900/50 border border-navy-800 p-6">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Settings className="h-4 w-4 text-navy-400" />
          Workspace
        </h3>
        <div className="space-y-4 text-sm">
          <div>
            <span className="text-navy-400 block mb-1">Name</span>
            <div className="font-medium">{workspace.name as string}</div>
          </div>
          <div>
            <span className="text-navy-400 block mb-1">Slug</span>
            <div className="font-mono text-navy-400">{workspace.slug as string}</div>
          </div>
          <div>
            <span className="text-navy-400 block mb-1">Tier</span>
            <div className="font-medium capitalize">{workspace.tier as string}</div>
          </div>
          <div>
            <span className="text-navy-400 block mb-1">Workspace ID</span>
            <div className="font-mono text-xs text-navy-400">{workspace.id as string}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
