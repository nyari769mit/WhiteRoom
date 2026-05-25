import { nanoid, customAlphabet } from 'nanoid';
import { TRIAL_TOKEN_ALPHABET, TRIAL_TOKEN_LENGTH, API_KEY_PREFIX } from './constants.js';

const trialTokenGenerator = customAlphabet(TRIAL_TOKEN_ALPHABET, TRIAL_TOKEN_LENGTH);
const apiKeyGenerator = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  32,
);

export function generateId(): string {
  return nanoid(21);
}

export function generateTrialToken(): string {
  return trialTokenGenerator();
}

export function generateApiKey(): string {
  return `${API_KEY_PREFIX}${apiKeyGenerator()}`;
}
