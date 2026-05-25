'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const PLANS = [
  {
    name: 'Trial',
    price: 'Free',
    period: '24 hours',
    description: 'See it working in 60 seconds',
    features: ['1 workspace', '1 agent group', 'Full agent management', 'Live dashboard', 'No signup required'],
    cta: 'Start free trial',
    href: '#cta',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$200',
    period: '/agent/month',
    description: 'For teams running AI agents in production',
    features: [
      'Unlimited workspaces',
      'Unlimited agent groups',
      'Agents take turns automatically',
      'Complete activity history',
      'API key management',
      'Live dashboard updates',
      'Priority support',
    ],
    cta: 'Talk to founders',
    href: 'mailto:hello@whiteroom.tech?subject=WhiteRoom%20Pro',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'Custom deployment & dedicated support',
    features: [
      'Everything in Pro',
      'Run on your own servers',
      'Custom scheduling rules',
      'SOC 2 compliance',
      'Dedicated account manager',
      'SLA guarantees',
    ],
    cta: 'Contact us',
    href: 'mailto:hello@whiteroom.tech?subject=WhiteRoom%20Enterprise',
    highlighted: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-4"
        >
          <div className="inline-flex items-center gap-2 rounded-full glass-card px-4 py-1.5 mb-6">
            <span className="font-mono text-xs text-accent-green">PRICING</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold">
            Simple, transparent pricing
          </h2>
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-navy-400 text-center mb-16 text-lg"
        >
          Start free. Upgrade when you&apos;re ready.
        </motion.p>

        <div className="grid md:grid-cols-3 gap-6 items-start">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                'relative rounded-2xl p-8 flex flex-col',
                plan.highlighted
                  ? 'glass-card border-accent-green/30 shadow-[0_0_60px_rgba(0,255,136,0.06)] md:-mt-4 md:pb-10'
                  : 'glass-card',
              )}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-md bg-accent-green px-4 py-1 text-[10px] font-bold text-navy-950 uppercase tracking-widest font-mono">
                  Most Popular
                </div>
              )}

              <h3 className="text-xl font-bold">{plan.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className={cn('text-4xl font-extrabold', plan.highlighted && 'text-accent-green neon-text-subtle')}>
                  {plan.price}
                </span>
                <span className="text-navy-400 text-sm font-mono">{plan.period}</span>
              </div>
              <p className="mt-2 text-sm text-navy-400">{plan.description}</p>

              <div className="mt-6 h-px bg-accent-green/10" />

              <ul className="mt-6 space-y-3 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm text-navy-200">
                    <Check className="h-4 w-4 text-accent-green mt-0.5 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <a
                href={plan.href}
                className={cn(
                  'mt-8 block rounded-xl px-4 py-3 text-center text-sm font-semibold transition-all duration-200 cursor-pointer',
                  plan.highlighted
                    ? 'bg-accent-green/10 border border-accent-green/40 text-accent-green hover:bg-accent-green/20 hover:shadow-[0_0_25px_rgba(0,255,136,0.15)]'
                    : 'border border-navy-700/50 text-navy-200 hover:border-accent-green/20 hover:text-accent-green',
                )}
              >
                {plan.cta}
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
