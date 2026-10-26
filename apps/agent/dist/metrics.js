import os from 'os';
import fs from 'fs';
export function getHostMetrics(activeVpsCount = 0) {
    const cpuCores = os.cpus().length || 4;
    const loadAvg = os.loadavg();
    // Compute approximate CPU load percentage
    const cpuLoadPercent = Math.min(100, Math.round((loadAvg[0] / cpuCores) * 100));
    const ramTotalMb = Math.round(os.totalmem() / (1024 * 1024));
    const ramFreeMb = Math.round(os.freemem() / (1024 * 1024));
    const ramUsedMb = ramTotalMb - ramFreeMb;
    const ramUsagePercent = Math.round((ramUsedMb / ramTotalMb) * 100);
    // Approximate disk storage stats
    let diskTotalGb = 100;
    let diskUsedGb = 35;
    try {
        if (fs.existsSync('/') && typeof fs.statfsSync === 'function') {
            const stat = fs.statfsSync('/');
            const totalBytes = stat.bsize * stat.blocks;
            const freeBytes = stat.bsize * stat.bfree;
            diskTotalGb = Math.round(totalBytes / (1024 * 1024 * 1024));
            diskUsedGb = Math.round((totalBytes - freeBytes) / (1024 * 1024 * 1024));
        }
    }
    catch (e) {
        // Fallback default
    }
    return {
        cpuCores,
        cpuLoadPercent,
        ramTotalMb,
        ramUsedMb,
        ramUsagePercent,
        diskTotalGb,
        diskUsedGb,
        diskUsagePercent: Math.round((diskUsedGb / diskTotalGb) * 100),
        uptimeSeconds: Math.round(os.uptime()),
        vpsCount: activeVpsCount
    };
}
