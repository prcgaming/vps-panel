import { db } from '../db/index.js';
export function normalizeKey(rawKey) {
    return (rawKey || '').trim().toUpperCase().replace(/\s+/g, '');
}
export function validateLicenseKey(rawKey) {
    const key = normalizeKey(rawKey);
    if (!key) {
        return { valid: false, planType: null, planName: '', durationDays: null, error: 'License key cannot be empty' };
    }
    // 1. Lifetime Unlimited Enterprise Key
    // e.g. LUNAR-LIFETIME-ENTERPRISE-UNLIMITED or VPS-LIFETIME-PRO-ENTERPRISE or containing LIFETIME
    if (key === 'LUNAR-LIFETIME-ENTERPRISE-UNLIMITED' ||
        key === 'VPS-LIFETIME-PRO-ENTERPRISE' ||
        key.includes('LIFETIME') ||
        key.startsWith('LIFE-')) {
        return {
            valid: true,
            planType: 'lifetime',
            planName: 'Enterprise Lifetime',
            durationDays: null
        };
    }
    // 2. 30-Day Unlimited Pro / Trial Key
    // e.g. LUNAR-30DAY-PRO-UNLIMITED or VPS-30D-UNLIMITED-TRIAL or containing 30D / 30DAY
    if (key === 'LUNAR-30DAY-PRO-UNLIMITED' ||
        key === 'VPS-30D-UNLIMITED-TRIAL' ||
        key.includes('30DAY') ||
        key.includes('30D') ||
        key.startsWith('TRIAL30-')) {
        return {
            valid: true,
            planType: 'trial_30d',
            planName: 'Pro 30-Day License',
            durationDays: 30
        };
    }
    return {
        valid: false,
        planType: null,
        planName: '',
        durationDays: null,
        error: 'Invalid license key format. Please use a valid 30-Day or Lifetime key.'
    };
}
export function getLicenseStatus() {
    try {
        const row = db.prepare('SELECT * FROM license_info WHERE id = ?').get('active_license');
        if (!row || !row.license_key) {
            return {
                activated: false,
                valid: false,
                status: 'unactivated',
                planType: null,
                planName: 'Unactivated',
                licenseKey: null,
                daysRemaining: null,
                expiresAt: null,
                activatedAt: null,
                maxNodes: 'Unlimited',
                maxVps: 'Unlimited',
                message: 'Panel activation required. Enter your 30-day or lifetime license key.'
            };
        }
        // Check expiration if not lifetime
        if (row.expires_at) {
            const expiresAtDate = new Date(row.expires_at);
            const now = new Date();
            if (expiresAtDate.getTime() <= now.getTime()) {
                // Mark as expired in DB
                db.prepare('UPDATE license_info SET status = ? WHERE id = ?').run('expired', 'active_license');
                return {
                    activated: true,
                    valid: false,
                    status: 'expired',
                    planType: row.plan_type,
                    planName: row.plan_type === 'lifetime' ? 'Enterprise Lifetime' : 'Pro 30-Day (Expired)',
                    licenseKey: row.license_key,
                    daysRemaining: 0,
                    expiresAt: row.expires_at,
                    activatedAt: row.activated_at,
                    maxNodes: 'Unlimited',
                    maxVps: 'Unlimited',
                    message: 'Your 30-day license has expired. Please renew or upgrade to Lifetime.'
                };
            }
            const diffMs = expiresAtDate.getTime() - now.getTime();
            const daysRemaining = Math.max(1, Math.ceil(diffMs / (24 * 3600 * 1000)));
            return {
                activated: true,
                valid: true,
                status: 'active',
                planType: row.plan_type,
                planName: row.plan_type === 'lifetime' ? 'Enterprise Lifetime' : 'Pro 30-Day License',
                licenseKey: row.license_key,
                daysRemaining,
                expiresAt: row.expires_at,
                activatedAt: row.activated_at,
                maxNodes: 'Unlimited',
                maxVps: 'Unlimited',
                message: `License active with ${daysRemaining} day(s) remaining.`
            };
        }
        // Lifetime License
        return {
            activated: true,
            valid: true,
            status: 'active',
            planType: 'lifetime',
            planName: 'Enterprise Lifetime',
            licenseKey: row.license_key,
            daysRemaining: null,
            expiresAt: null,
            activatedAt: row.activated_at,
            maxNodes: 'Unlimited',
            maxVps: 'Unlimited',
            message: 'Lifetime Enterprise license active. Permanent unlimited access.'
        };
    }
    catch (err) {
        console.error('[License] Error querying status:', err);
        return {
            activated: false,
            valid: false,
            status: 'unactivated',
            planType: null,
            planName: 'Error checking license',
            licenseKey: null,
            daysRemaining: null,
            expiresAt: null,
            activatedAt: null,
            maxNodes: 'Unlimited',
            maxVps: 'Unlimited',
            message: 'Failed to read license info.'
        };
    }
}
export function activateLicense(rawKey, registeredTo = 'Lunar Administrator') {
    const check = validateLicenseKey(rawKey);
    if (!check.valid || !check.planType) {
        return { success: false, message: check.error || 'Invalid license key' };
    }
    const normalized = normalizeKey(rawKey);
    const now = new Date();
    let expiresAt = null;
    if (check.durationDays) {
        const exp = new Date(now.getTime() + check.durationDays * 24 * 3600 * 1000);
        expiresAt = exp.toISOString();
    }
    db.prepare(`
    INSERT INTO license_info (id, license_key, plan_type, status, activated_at, expires_at, max_nodes, max_vps, registered_to)
    VALUES ('active_license', ?, ?, 'active', ?, ?, -1, -1, ?)
    ON CONFLICT(id) DO UPDATE SET
      license_key = excluded.license_key,
      plan_type = excluded.plan_type,
      status = excluded.status,
      activated_at = excluded.activated_at,
      expires_at = excluded.expires_at,
      registered_to = excluded.registered_to
  `).run(normalized, check.planType, now.toISOString(), expiresAt, registeredTo);
    console.log(`[License] Successfully activated ${check.planName} (Key: ${normalized})`);
    return {
        success: true,
        message: `${check.planName} activated successfully!`,
        status: getLicenseStatus()
    };
}
