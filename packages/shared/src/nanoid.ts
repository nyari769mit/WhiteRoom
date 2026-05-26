import { nanoid, customAlphabet } from 'nanoid';
import { TRIAL_TOKEN_ALPHABET, TRIAL_TOKEN_LENGTH, API_KEY_PREFIX } from './constants.js';

const trialTokenGenerator = customAlphabet(TRIAL_TOKEN_ALPHABET, TRIAL_TOKEN_LENGTH);
const apiKeyGenerator = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  32,
);

/** Generates a 21-character nanoid for database primary keys. */
export function generateId(): string {
  return nanoid(21);
}

/** Generates a 6-character trial token using an unambiguous alphabet (no 0/1/l/o/i). */
export function generateTrialToken(): string {
  return trialTokenGenerator();
}

/** Generates a WhiteRoom API key with `wr_` prefix and 32 random alphanumeric characters. */
export function generateApiKey(): string {
  return `${API_KEY_PREFIX}${apiKeyGenerator()}`;
}
