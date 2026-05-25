import { cn } from '@/lib/utils';

const STATUS_COLORS = {
  working: 'bg-accent-green shadow-[0_0_6px_rgba(0,255,136,0.5)]',
  resting: 'bg-accent-amber shadow-[0_0_6px_rgba(255,184,0,0.5)]',
  idle: 'bg-navy-600',
} as const;

export function StatusDot({
  status,
  className,
}: {
  status: 'working' | 'resting' | 'idle';
  className?: string;
}) {
  return (
    <span className={cn('relative flex h-2.5 w-2.5', className)}>
      {status === 'working' && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-green opacity-50" />
      )}
      <span className={cn('relative inline-flex h-2.5 w-2.5 rounded-full', STATUS_COLORS[status])} />
    </span>
  );
}
