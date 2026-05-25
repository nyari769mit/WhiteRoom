'use client';

import { motion } from 'framer-motion';
import { Layers, ArrowDownUp, Eye } from 'lucide-react';
import { CopyButton } from '@/components/copy-button';

const STEPS = [
  {
    icon: Layers,
    title: 'Change one setting in your agent',
    description: 'Tell your AI agent to send requests through WhiteRoom instead of directly to OpenAI or Anthropic. It\'s one line — everything else stays the same.',
    code: 'ANTHROPIC_BASE_URL=https://api.whiteroom.tech/t/{token}/v1',
    copyable: true,
  },
  {
    icon: ArrowDownUp,
    title: 'WhiteRoom manages your agent automatically',
    description: 'When a conversation gets too long, WhiteRoom summarizes it, gives the agent a break, then restarts it with the summary — so it never loses track of what it was doing.',
    code: 'agent works → conversation summarized → short break → picks up where it left off',
    copyable: false,
  },
  {
    icon: Eye,
    title: 'Watch everything happen live',
    description: 'Your dashboard updates instantly — see which agents are running, how much they cost, what they decided, and read the summaries WhiteRoom generates.',
    code: 'dashboard updates in real-time as your agents work',
    copyable: false,
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-4"
        >
          <div className="inline-flex items-center gap-2 rounded-full glass-card px-4 py-1.5 mb-6">
            <span className="font-mono text-xs text-accent-green">PROTOCOL</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold">
            Three steps. Sixty seconds.
          </h2>
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-navy-400 text-center mb-16 text-lg"
        >
          No new tools to learn. No code to rewrite. Just one setting.
        </motion.p>

        <div className="relative space-y-6">
          <div className="absolute left-[31px] top-16 bottom-16 w-px bg-gradient-to-b from-accent-green/30 via-accent-green/10 to-transparent hidden md:block" />

          {STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="flex flex-col md:flex-row gap-6 rounded-2xl glass-card p-8 hover:border-accent-green/20 transition-all duration-200"
            >
              <div className="flex items-start gap-4 md:w-1/2">
                <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-accent-green/5 border border-accent-green/20">
                  <step.icon className="h-6 w-6 text-accent-green" />
                  <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-md bg-accent-green text-[11px] font-bold text-navy-950 font-mono">
                    {i + 1}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-navy-400 text-sm leading-relaxed">{step.description}</p>
                </div>
              </div>
              <div className="md:w-1/2">
                <div className="relative rounded-lg bg-navy-950 border border-accent-green/10 p-4 font-mono text-sm text-accent-green/80 overflow-x-auto">
                  <div className="absolute top-2 left-4 flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-accent-red/50" />
                    <div className="h-1.5 w-1.5 rounded-full bg-accent-amber/50" />
                    <div className="h-1.5 w-1.5 rounded-full bg-accent-green/50" />
                  </div>
                  <div className="mt-4">{step.code}</div>
                  {step.copyable && (
                    <div className="absolute top-2 right-2">
                      <CopyButton text={step.code} className="!px-2 !py-1 text-xs" />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
