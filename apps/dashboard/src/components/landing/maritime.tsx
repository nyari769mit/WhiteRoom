'use client';

import { motion } from 'framer-motion';
import { Anchor } from 'lucide-react';

export function Maritime() {
  return (
    <section className="py-24 px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--color-navy-900)_0%,_transparent_70%)]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-3xl mx-auto text-center relative"
      >
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-xl bg-accent-green/5 border border-accent-green/20 mb-8">
          <Anchor className="h-7 w-7 text-accent-green" />
        </div>

        <div className="inline-flex items-center gap-2 rounded-full glass-card px-4 py-1.5 mb-6">
          <span className="font-mono text-xs text-accent-green">ORIGIN</span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-bold mb-8">
          Inspired by how ships have worked for centuries
        </h2>

        <div className="relative text-left">
          <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-accent-green/40 via-accent-green/20 to-transparent" />
          <blockquote className="pl-8">
            <p className="text-navy-300 leading-relaxed text-lg">
              For centuries, international maritime law has required ship officers to work in shifts —
              fixed hours on duty, mandatory rest, and a written handover to the next officer.
              A ship that runs its crew around the clock without rotation doesn&apos;t get there faster. It crashes.
            </p>
            <p className="text-navy-300 leading-relaxed text-lg mt-4">
              AI agents are the same. The longer they run without a break, the more expensive and
              unreliable they become. WhiteRoom gives your agents the same discipline —
              because the most dangerous thing in production isn&apos;t a slow agent,
              it&apos;s an <span className="text-accent-green neon-text-subtle font-medium">exhausted one</span>.
            </p>
          </blockquote>
        </div>
      </motion.div>
    </section>
  );
}
