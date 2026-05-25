'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { fetchWorkspaceDetails } from '@/lib/api';
import { Layers } from 'lucide-react';

export default function FleetsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [fleets, setFleets] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkspaceDetails(slug).then((data) => {
      if (data?.fleets) setFleets(data.fleets);
      setLoading(false);
    });
  }, [slug]);

  if (loading) return <div className="text-navy-400">Loading fleets...</div>;

  if (fleets.length === 0) {
    return (
      <div className="max-w-6xl">
        <h1 className="text-2xl font-bold mb-8">Fleets</h1>
        <div className="rounded-xl bg-navy-900/50 border border-navy-800 p-12 text-center">
          <Layers className="h-8 w-8 text-navy-600 mx-auto mb-4" />
          <h3 className="text-sm font-semibold mb-2">No fleets configured</h3>
          <p className="text-sm text-navy-400">A default fleet is created with your workspace.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-bold mb-8">Fleets</h1>
      <div className="grid gap-4">
        {fleets.map((fleet) => (
          <div key={fleet.id as string} className="rounded-xl bg-navy-900/50 border border-navy-800 p-6">
            <h3 className="font-semibold mb-3">{fleet.name as string}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-navy-400">Watch Limit</span>
                <div className="font-medium">{((fleet.watchLimitTokens as number) || 100000).toLocaleString()} tokens</div>
              </div>
              <div>
                <span className="text-navy-400">Rest Period</span>
                <div className="font-medium">{(fleet.restSeconds as number) || 60}s</div>
              </div>
              <div>
                <span className="text-navy-400">ID</span>
                <div className="font-mono text-xs text-navy-400 truncate">{fleet.id as string}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
