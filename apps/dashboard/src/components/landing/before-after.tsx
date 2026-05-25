'use client';

import { motion } from 'framer-motion';
import { AnimatedCounter } from '@/components/animated-counter';
import { X, Check, AlertTriangle, ShieldCheck } from 'lucide-react';

const WITHOUT = [
  'Conversations get longer and more expensive every message',
  'When one agent stops, the next starts from scratch',
  'You pay $12K+/mo re-reading the same information',
  'No way to see what your agents are doing or why',
];

const WITH = [
  'Conversations are automatically summarized to stay short',
  'Agents pick up exactly where the last one left off',
  'Save 88% on AI costs',
  'See every agent action in a live dashboard',
];

export function BeforeAfter() {
  return (
    <section className="py-24 px-6 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--color-navy-900)_0%,_transparent_70%)]" />

      <div className="max-w-5xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 rounded-full glass-card px-4 py-1.5 mb-6">
            <span className="font-mono text-xs text-accent-green">ANALYSIS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">
            Token savings:{' '}
            <AnimatedCounter value={88} suffix="%" className="text-accent-green neon-text-subtle font-extrabold" />
          </h2>
          <p className="text-navy-400 text-lg font-mono text-sm">Real data from production agent fleets</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl glass-card border-accent-red/10 p-8 relative overflow-hidden scanline-overlay"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-accent-red/5 rounded-full blur-[80px]" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <AlertTriangle className="h-4 w-4 text-accent-red" />
                <span className="text-xs font-mono font-semibold text-accent-red uppercase tracking-widest">
                  Without WhiteRoom
                </span>
              </div>
              <ul className="space-y-4">
                {WITHOUT.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-navy-400">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded mt-0.5 bg-accent-red/10 border border-accent-red/20">
                      <X className="h-3 w-3 text-accent-red" />
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl glass-card border-accent-green/20 p-8 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-accent-green/5 rounded-full blur-[80px]" />
            <div className="absolute inset-0 bg-gradient-to-br from-accent-green/[0.02] to-transparent" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <ShieldCheck className="h-4 w-4 text-accent-green" />
                <span className="text-xs font-mono font-semibold text-accent-green uppercase tracking-widest">
                  With WhiteRoom
                </span>
              </div>
              <ul className="space-y-4">
                {WITH.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-navy-100">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded mt-0.5 bg-accent-green/10 border border-accent-green/20">
                      <Check className="h-3 w-3 text-accent-green" />
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
