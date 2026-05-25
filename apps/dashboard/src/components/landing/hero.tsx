'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Shield, Zap, Lock, Terminal } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 pt-24 pb-16 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-navy-800)_0%,_var(--color-navy-950)_70%)]" />

      <div
        className="absolute inset-0 animate-grid-fade"
        style={{
          backgroundImage:
            'linear-gradient(var(--color-accent-green) 1px, transparent 1px), linear-gradient(90deg, var(--color-accent-green) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
          opacity: 0.03,
        }}
      />

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-gradient-to-b from-accent-green/20 via-transparent to-transparent" />

      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-accent-green/[0.04] blur-[150px] animate-glow-pulse" />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-full h-[2px] bg-gradient-to-r from-transparent via-accent-green/20 to-transparent animate-scan" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 rounded-full glass-card px-4 py-1.5 mb-8"
        >
          <Terminal className="h-4 w-4 text-accent-green" />
          <span className="text-sm text-navy-200 font-mono">keep your AI agents running without burning money</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]"
        >
          Your agents work in
          <br />
          <span className="text-accent-green neon-text animate-flicker">
            shifts, not sprints
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 text-lg sm:text-xl text-navy-400 max-w-2xl mx-auto leading-relaxed"
        >
          WhiteRoom sits between your AI agents and their AI provider. It automatically
          saves their memory when it gets too long, rotates them on and off duty, and logs
          everything — cutting your AI costs by up to 88%.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <a
            href="#cta"
            className="group relative inline-flex items-center gap-2 rounded-xl bg-accent-green/10 border border-accent-green/40 px-7 py-3.5 text-base font-semibold text-accent-green hover:bg-accent-green/20 hover:border-accent-green/60 hover:shadow-[0_0_40px_rgba(0,255,136,0.2)] transition-all duration-200 cursor-pointer"
          >
            Try it instantly — no signup
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
          <a
            href="#how-it-works"
            className="inline-flex items-center gap-2 rounded-xl border border-navy-700/50 px-7 py-3.5 text-base font-medium text-navy-200 hover:border-accent-green/20 hover:text-accent-green transition-all duration-200 cursor-pointer"
          >
            See how it works
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16 flex items-center justify-center gap-8 text-navy-600"
        >
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-accent-green/50" />
            <span className="text-xs font-mono">60s setup</span>
          </div>
          <div className="h-4 w-px bg-accent-green/10" />
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-accent-green/50" />
            <span className="text-xs font-mono">Your keys stay yours</span>
          </div>
          <div className="hidden sm:block h-4 w-px bg-accent-green/10" />
          <div className="hidden sm:flex items-center gap-2">
            <Shield className="h-4 w-4 text-accent-green/50" />
            <span className="text-xs font-mono">open source</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
