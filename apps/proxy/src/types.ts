import type { DbClient } from '@whiteroom/db';

export type AppVariables = {
  db: DbClient;
  workspace: {
    id: string;
    name: string;
    slug: string;
    ownerUserId: string | null;
    tier: string;
    isEphemeral: boolean;
    trialToken: string | null;
    expiresAt: Date | null;
    createdAt: Date;
  };
};
