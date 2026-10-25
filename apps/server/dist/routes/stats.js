import { Router } from 'express';
import { db } from '../db/index.js';
import { authenticate } from '../middleware/auth.js';
import { wsHub } from '../ws/hub.js';
const router = Router();
// GET /api/stats - Global cluster statistics
router.get('/', authenticate, (req, res) => {
    const nodes = db.prepare('SELECT * FROM nodes').all();
    const vpsList = db.prepare('SELECT * FROM vps_instances').all();
    const totalNodes = nodes.length;
    const onlineNodes = nodes.filter(n => wsHub.isNodeOnline(n.id) || n.status === 'online').length;
    const totalVps = vpsList.length;
    const runningVps = vpsList.filter(v => v.status === 'running').length;
    const stoppedVps = vpsList.filter(v => v.status === 'stopped').length;
    const totalCpuCores = nodes.reduce((sum, n) => sum + (n.cpu_cores || 0), 0);
    const allocatedCpuCores = vpsList.reduce((sum, v) => sum + (v.cpu_cores || 0), 0);
    const totalRamMb = nodes.reduce((sum, n) => sum + (n.ram_total || 0), 0);
    const allocatedRamMb = vpsList.reduce((sum, v) => sum + (v.ram_mb || 0), 0);
    const totalDiskGb = nodes.reduce((sum, n) => sum + (n.disk_total || 0), 0);
    const allocatedDiskGb = vpsList.reduce((sum, v) => sum + (v.disk_gb || 0), 0);
    res.json({
        nodes: {
            total: totalNodes,
            online: onlineNodes,
            offline: totalNodes - onlineNodes
        },
        vps: {
            total: totalVps,
            running: runningVps,
            stopped: stoppedVps
        },
        resources: {
            cpu: { total: totalCpuCores, allocated: allocatedCpuCores, percent: totalCpuCores ? Math.round((allocatedCpuCores / totalCpuCores) * 100) : 0 },
            ram: { totalMb: totalRamMb, allocatedMb: allocatedRamMb, percent: totalRamMb ? Math.round((allocatedRamMb / totalRamMb) * 100) : 0 },
            disk: { totalGb: totalDiskGb, allocatedGb: allocatedDiskGb, percent: totalDiskGb ? Math.round((allocatedDiskGb / totalDiskGb) * 100) : 0 }
        }
    });
});
export default router;
