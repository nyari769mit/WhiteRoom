'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchWorkspaceDetails, createApiKey, revokeApiKey } from '@/lib/api';
import { CopyButton } from '@/components/copy-button';
import { Key, Plus, Trash2, AlertTriangle } from 'lucide-react';

interface ApiKeyEntry {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  revokedAt: string | null;
}

export default function ApiKeysPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [keys, setKeys] = useState<ApiKeyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKey, setNewKey] = useState<{ key: string; name: string } | null>(null);
  const [creating, setCreating] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);

  useEffect(() => {
    fetchWorkspaceDetails(slug).then((data) => {
      if (data?.apiKeys) setKeys(data.apiKeys);
      setLoading(false);
    });
  }, [slug]);

  async function handleCreate() {
    setCreating(true);
    try {
      const result = await createApiKey(slug, keyName || 'Untitled');
      setNewKey({ key: result.key, name: keyName || 'Untitled' });
      setKeys((prev) => [
        ...prev,
        { id: result.id, name: keyName || 'Untitled', keyPrefix: result.prefix, createdAt: new Date().toISOString(), revokedAt: null },
      ]);
      setKeyName('');
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(keyId: string) {
    await revokeApiKey(slug, keyId);
    setKeys((prev) => prev.map((k) => (k.id === keyId ? { ...k, revokedAt: new Date().toISOString() } : k)));
    setConfirmRevoke(null);
  }

  if (loading) return <div className="text-navy-400">Loading API keys...</div>;

  const activeKeys = keys.filter((k) => !k.revokedAt);

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-8">API Keys</h1>

      <AnimatePresence>
        {newKey && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 rounded-xl bg-accent-green/5 border border-accent-green/20 p-6"
          >
            <div className="flex items-start gap-3 mb-3">
              <AlertTriangle className="h-5 w-5 text-accent-amber shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold">Save this key — it won&apos;t be shown again</h3>
                <p className="text-xs text-navy-400 mt-1">Key: {newKey.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-lg bg-navy-950 border border-navy-800 px-4 py-2.5 font-mono text-sm text-accent-green break-all">
                {newKey.key}
              </code>
              <CopyButton text={newKey.key} />
            </div>
            <button
              onClick={() => setNewKey(null)}
              className="mt-3 text-xs text-navy-400 hover:text-navy-200 cursor-pointer"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="rounded-xl bg-navy-900/50 border border-navy-800 p-6 mb-6">
        <h3 className="text-sm font-semibold mb-4">Create new key</h3>
        <div className="flex gap-3">
          <input
            type="text"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            placeholder="Key name (e.g. Production)"
            className="flex-1 rounded-lg bg-navy-950 border border-navy-800 px-4 py-2.5 text-sm placeholder:text-navy-600 focus:border-accent-green/50 focus:outline-none transition-colors"
          />
          <button
            onClick={handleCreate}
            disabled={creating}
            className="inline-flex items-center gap-2 rounded-lg bg-accent-green px-4 py-2.5 text-sm font-semibold text-navy-950 hover:bg-accent-green-light transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Create
          </button>
        </div>
      </div>

      {activeKeys.length === 0 && !newKey ? (
        <div className="rounded-xl bg-navy-900/50 border border-navy-800 p-12 text-center">
          <Key className="h-8 w-8 text-navy-600 mx-auto mb-4" />
          <h3 className="text-sm font-semibold mb-2">No API keys</h3>
          <p className="text-sm text-navy-400">Create one above to start sending requests.</p>
        </div>
      ) : (
        <div className="rounded-xl bg-navy-900/50 border border-navy-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-800 text-navy-400">
                <th className="text-left px-5 py-3 font-medium">Name</th>
                <th className="text-left px-5 py-3 font-medium">Key</th>
                <th className="text-left px-5 py-3 font-medium">Created</th>
                <th className="text-right px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeKeys.map((key) => (
                <tr key={key.id} className="border-b border-navy-800/50 last:border-0">
                  <td className="px-5 py-3 font-medium">{key.name}</td>
                  <td className="px-5 py-3 font-mono text-navy-400">{key.keyPrefix}...</td>
                  <td className="px-5 py-3 text-navy-400">
                    {new Date(key.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {confirmRevoke === key.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs text-accent-red">Sure?</span>
                        <button
                          onClick={() => handleRevoke(key.id)}
                          className="text-xs text-accent-red hover:underline cursor-pointer"
                        >
                          Yes, revoke
                        </button>
                        <button
                          onClick={() => setConfirmRevoke(null)}
                          className="text-xs text-navy-400 hover:underline cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmRevoke(key.id)}
                        className="text-navy-400 hover:text-accent-red cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
