'use client';

import { useParams } from 'next/navigation';
import { useSSE } from '@/hooks/use-sse';
import { AuditLog } from '@/components/dashboard/audit-log';

export default function AuditPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { events } = useSSE(slug);

  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-bold mb-8">Audit Log</h1>
      <AuditLog events={events} />
    </div>
  );
}
