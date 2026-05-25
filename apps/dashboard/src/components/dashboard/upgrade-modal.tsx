'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Crown, ArrowRight } from 'lucide-react';
import { trackEvent } from '@/lib/posthog';

const PRO_FEATURES = [
  'Unlimited workspaces & agent groups',
  'Agents take turns automatically',
  'Complete activity history',
  'API key management',
  'Live dashboard updates',
  'Priority support',
];

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

export function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-md rounded-2xl glass-card border-accent-green/20 p-8 relative overflow-hidden scanline-overlay"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-accent-green/[0.03] to-transparent" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-green/5 border border-accent-green/20">
                    <Crown className="h-5 w-5 text-accent-green" />
                  </div>
                  <h2 className="text-lg font-bold font-mono uppercase tracking-wider">Upgrade to Pro</h2>
                </div>
                <button
                  onClick={onClose}
                  className="text-navy-400 hover:text-accent-green cursor-pointer p-1 rounded hover:bg-accent-green/5 transition-colors"
                  aria-label="Close upgrade modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-extrabold text-accent-green neon-text-subtle font-mono">$200</span>
                  <span className="text-navy-400 font-mono text-xs">/agent/month</span>
                </div>
                <p className="text-sm text-navy-400">For teams running production AI fleets</p>
              </div>

              <div className="h-px bg-accent-green/10 mb-6" />

              <ul className="space-y-3 mb-8">
                {PRO_FEATURES.map((feature) => (
                  <li key={feature} className="flex items-center gap-2.5 text-sm text-navy-200">
                    <Check className="h-4 w-4 text-accent-green shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <a
                href="mailto:hello@whiteroom.tech?subject=WhiteRoom%20Pro%20Upgrade"
                onClick={() => trackEvent('upgrade_clicked')}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-accent-green/10 border border-accent-green/40 px-4 py-3 text-sm font-mono font-semibold text-accent-green hover:bg-accent-green/20 hover:shadow-[0_0_30px_rgba(0,255,136,0.15)] transition-all duration-200 cursor-pointer"
              >
                Talk to founders
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>

              <p className="mt-4 text-center text-[10px] text-navy-600 font-mono">
                Account setup within 24 hours
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
