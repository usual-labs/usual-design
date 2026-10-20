import type { AuditResult, Inventory, Manifest } from '../../src/types.js';
import type { OnboardingState } from '../../src/onboarding-types.js';
export type { Finding, Inventory, ObservedValue, Token } from '../../src/types.js';

export const categories = [
  'colors',
  'typography',
  'spacing',
  'shape',
  'components',
  'coverage',
] as const;
export type Category = (typeof categories)[number];
export type Audit = AuditResult;

export interface ProjectState {
  onboarding?: OnboardingState | null;
  projectRoot?: string;
  manifestPath?: string;
  manifest: Manifest | null;
  draft?: Manifest;
  manifestHash: string | null;
  audit: Audit | null;
  inventory?: Inventory;
  existingPreview?: string;
  error?: string;
}

export interface Handoff {
  path: string;
  prompt: string;
  plan: unknown;
}
