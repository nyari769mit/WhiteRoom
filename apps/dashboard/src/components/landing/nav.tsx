'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Docs', href: '/docs' },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={cn(
        'fixed top-4 left-4 right-4 z-50 flex items-center justify-between rounded-2xl px-6 py-3 transition-all duration-300',
        scrolled
          ? 'glass-card shadow-lg shadow-black/30'
          : 'bg-transparent',
      )}
    >
      <a href="/" className="text-xl font-bold tracking-tight cursor-pointer">
        <span className="text-navy-50">White</span>
        <span className="text-accent-green neon-text-subtle">Room</span>
      </a>

      <div className="hidden md:flex items-center gap-8">
        {NAV_LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="text-sm text-navy-400 hover:text-accent-green transition-colors duration-150 cursor-pointer font-medium"
          >
            {link.label}
          </a>
        ))}
        <a
          href="#cta"
          className="group relative rounded-xl bg-accent-green/10 border border-accent-green/30 px-5 py-2 text-sm font-semibold text-accent-green hover:bg-accent-green/20 hover:border-accent-green/50 hover:shadow-[0_0_25px_rgba(0,255,136,0.15)] transition-all duration-200 cursor-pointer"
        >
          <span className="relative z-10">Try it instantly</span>
        </a>
      </div>

      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="md:hidden text-navy-400 hover:text-accent-green cursor-pointer"
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full left-0 right-0 mt-2 rounded-xl glass-card p-4 md:hidden"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block py-3 text-sm text-navy-400 hover:text-accent-green cursor-pointer"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#cta"
            onClick={() => setMobileOpen(false)}
            className="mt-2 block rounded-xl bg-accent-green/10 border border-accent-green/30 px-4 py-2.5 text-center text-sm font-semibold text-accent-green cursor-pointer"
          >
            Try it instantly
          </a>
        </motion.div>
      )}
    </motion.nav>
  );
}
