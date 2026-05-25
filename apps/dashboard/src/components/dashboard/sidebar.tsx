'use client';

import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Bot,
  ScrollText,
  Layers,
  Key,
  Settings,
  Crown,
} from 'lucide-react';

interface SidebarProps {
  slug: string;
  tier: string;
  onUpgrade: () => void;
}

const NAV_ITEMS = [
  { label: 'Overview', icon: LayoutDashboard, path: '' },
  { label: 'Agents', icon: Bot, path: '/agents' },
  { label: 'Audit', icon: ScrollText, path: '/audit' },
  { label: 'Fleets', icon: Layers, path: '/fleets' },
  { label: 'API Keys', icon: Key, path: '/api-keys' },
  { label: 'Settings', icon: Settings, path: '/settings' },
];

export function Sidebar({ slug, tier, onUpgrade }: SidebarProps) {
  const pathname = usePathname();
  const base = `/dashboard/${slug}`;

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-accent-green/10 bg-navy-900/30 backdrop-blur-sm">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-accent-green/10">
        <a href="/" className="text-lg font-bold tracking-tight cursor-pointer">
          White<span className="text-accent-green neon-text-subtle">Room</span>
        </a>
        <span
          className={cn(
            'rounded px-2 py-0.5 text-[9px] font-mono font-semibold uppercase tracking-widest',
            tier === 'pro'
              ? 'bg-accent-green/10 text-accent-green border border-accent-green/20'
              : tier === 'enterprise'
                ? 'bg-accent-blue/10 text-accent-blue border border-accent-blue/20'
                : 'bg-accent-amber/10 text-accent-amber border border-accent-amber/20',
          )}
        >
          {tier}
        </span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const href = `${base}${item.path}`;
          const isActive = pathname === href || (item.path === '' && pathname === base);
          return (
            <a
              key={item.path}
              href={href}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 cursor-pointer',
                isActive
                  ? 'bg-accent-green/5 border border-accent-green/15 text-accent-green'
                  : 'text-navy-400 hover:bg-accent-green/5 hover:text-navy-200 border border-transparent',
              )}
            >
              <item.icon className={cn('h-4 w-4', isActive && 'text-accent-green')} />
              <span className="font-mono text-xs">{item.label}</span>
              {isActive && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-accent-green shadow-[0_0_6px_rgba(0,255,136,0.5)]" />
              )}
            </a>
          );
        })}
      </nav>

      {tier !== 'enterprise' && (
        <div className="px-3 pb-3">
          <button
            onClick={onUpgrade}
            className="flex w-full items-center gap-2 rounded-lg border border-accent-green/20 bg-accent-green/5 px-3 py-2.5 text-xs font-mono font-medium text-accent-green hover:bg-accent-green/10 hover:border-accent-green/30 transition-all duration-150 cursor-pointer"
          >
            <Crown className="h-4 w-4" />
            Upgrade plan
          </button>
        </div>
      )}

      <div className="border-t border-accent-green/10 px-6 py-4 flex items-center gap-3">
        <UserButton />
        <span className="text-[10px] text-navy-600 font-mono truncate">{slug}</span>
      </div>
    </aside>
  );
}
