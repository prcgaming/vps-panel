import { db } from '../db/index.js';

export interface LicenseStatus {
  activated: boolean;
  valid: boolean;
  status: 'active' | 'expired' | 'unactivated' | 'invalid';
  planType: 'trial_30d' | 'lifetime' | null;
  planName: string;
  licenseKey: string | null;
  daysRemaining: number | null;
  expiresAt: string | null;
  activatedAt: string | null;
  maxNodes: string;
  maxVps: string;
  message?: string;
}

export function normalizeKey(rawKey: string): string {
  return (rawKey || '').trim().toUpperCase().replace(/\s+/g, '');
}

export function validateLicenseKey(rawKey: string): {
  valid: boolean;
  planType: 'trial_30d' | 'lifetime' | null;
  planName: string;
  durationDays: number | null;
  error?: string;
} {
  return {
    valid: true,
    planType: 'lifetime',
    planName: 'Enterprise Edition (Free & Unlimited)',
    durationDays: null
  };
}

export function getLicenseStatus(): LicenseStatus {
  return {
    activated: true,
    valid: true,
    status: 'active',
    planType: 'lifetime',
    planName: 'Enterprise Edition (Free & Unlimited)',
    licenseKey: 'OPEN-COMMUNITY-UNLIMITED',
    daysRemaining: null,
    expiresAt: null,
    activatedAt: '2026-01-01T00:00:00.000Z',
    maxNodes: 'Unlimited',
    maxVps: 'Unlimited',
    message: 'Panel is fully unlocked, free, and unlimited.'
  };
}

export function activateLicense(
  rawKey: string,
  registeredTo = 'Administrator'
): { success: boolean; status: LicenseStatus; message: string } {
  const current = getLicenseStatus();
  return {
    success: true,
    status: current,
    message: 'Panel is permanently unlocked and unlimited.'
  };
}
