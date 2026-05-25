'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2, Shield } from 'lucide-react';
import { trackEvent } from '@/lib/posthog';

const PROXY_URL = process.env.NEXT_PUBLIC_PROXY_URL || 'http://localhost:8080';

export function CTA() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setLoading(true);
    setError(null);
    try {
      trackEvent('trial_started');
      const res = await fetch(`${PROXY_URL}/api/trial/create`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to create trial');
      const data = await res.json();
      window.location.href = `/t/${data.trial_token}`;
    } catch {
      setError('Could not create trial. Please try again.');
      setLoading(false);
    }
  }

  return (
    <section id="cta" className="py-24 px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--color-accent-green)_0%,_transparent_70%)] opacity-[0.03]" />

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-accent-green/5 animate-glow-pulse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full border border-accent-green/10 animate-glow-pulse" style={{ animationDelay: '1s' }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-2xl mx-auto text-center relative"
      >
        <div className="inline-flex items-center gap-2 rounded-full glass-card px-4 py-1.5 mb-6">
          <span className="font-mono text-xs text-accent-green">INITIALIZE</span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-bold mb-4">
          See it live in <span className="text-accent-green neon-text-subtle">60 seconds</span>
        </h2>
        <p className="text-navy-400 text-lg mb-10">
          No signup. No credit card. Click the button, paste one line into your agent, and watch it work.
        </p>

        <button
          onClick={handleCreate}
          disabled={loading}
          className="group relative inline-flex items-center gap-2 rounded-xl bg-accent-green/10 border border-accent-green/40 px-8 py-4 text-lg font-semibold text-accent-green hover:bg-accent-green/20 hover:border-accent-green/60 hover:shadow-[0_0_50px_rgba(0,255,136,0.2)] transition-all duration-200 disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="font-mono">Initializing...</span>
            </>
          ) : (
            <>
              Try it instantly
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </button>

        {error && (
          <p className="mt-4 text-sm text-accent-red font-mono">{error}</p>
        )}

        <div className="mt-8 flex items-center justify-center gap-2 text-navy-600">
          <Shield className="h-3.5 w-3.5 text-accent-green/40" />
          <span className="text-xs font-mono">Your API keys are never stored — they pass straight through to your AI provider</span>
        </div>
      </motion.div>
    </section>
  );
}
