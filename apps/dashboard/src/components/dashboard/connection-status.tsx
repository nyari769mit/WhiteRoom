'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';

interface ConnectionStatusProps {
  status: 'connecting' | 'connected' | 'disconnected';
}

export function ConnectionStatus({ status }: ConnectionStatusProps) {
  return (
    <AnimatePresence mode="wait">
      {status === 'disconnected' && (
        <motion.div
          key="disconnected"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-center gap-2 rounded-lg bg-accent-red/5 border border-accent-red/20 px-3 py-1.5"
        >
          <WifiOff className="h-3.5 w-3.5 text-accent-red" />
          <span className="text-[10px] text-accent-red font-mono uppercase tracking-wider">Reconnecting</span>
        </motion.div>
      )}
      {status === 'connecting' && (
        <motion.div
          key="connecting"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-center gap-2 rounded-lg bg-accent-amber/5 border border-accent-amber/20 px-3 py-1.5"
        >
          <Loader2 className="h-3.5 w-3.5 text-accent-amber animate-spin" />
          <span className="text-[10px] text-accent-amber font-mono uppercase tracking-wider">Connecting</span>
        </motion.div>
      )}
      {status === 'connected' && (
        <motion.div
          key="connected"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-center gap-2 rounded-lg bg-accent-green/5 border border-accent-green/20 px-3 py-1.5"
        >
          <div className="relative">
            <Wifi className="h-3.5 w-3.5 text-accent-green" />
            <div className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-accent-green shadow-[0_0_4px_rgba(0,255,136,0.6)]" />
          </div>
          <span className="text-[10px] text-accent-green font-mono uppercase tracking-wider">Live</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
