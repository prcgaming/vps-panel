export function normalizeKey(rawKey) {
    return (rawKey || '').trim().toUpperCase().replace(/\s+/g, '');
}
export function validateLicenseKey(rawKey) {
    return {
        valid: true,
        planType: 'lifetime',
        planName: 'Enterprise Edition (Free & Unlimited)',
        durationDays: null
    };
}
export function getLicenseStatus() {
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
export function activateLicense(rawKey, registeredTo = 'Administrator') {
    const current = getLicenseStatus();
    return {
        success: true,
        status: current,
        message: 'Panel is permanently unlocked and unlimited.'
    };
}
