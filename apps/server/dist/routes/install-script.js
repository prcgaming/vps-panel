import { Router } from 'express';
import fs from 'fs';
import path from 'path';
const router = Router();
// GET /api/install-script - Serve install script directly
router.get('/', (req, res) => {
    const rootScriptPath = path.resolve(process.cwd(), '../../install.sh');
    const fallbackScriptPath = path.resolve(process.cwd(), 'install.sh');
    let scriptContent = '';
    if (fs.existsSync(rootScriptPath)) {
        scriptContent = fs.readFileSync(rootScriptPath, 'utf8');
    }
    else if (fs.existsSync(fallbackScriptPath)) {
        scriptContent = fs.readFileSync(fallbackScriptPath, 'utf8');
    }
    else {
        res.status(404).send('#!/bin/bash\necho "Install script not found on server."\nexit 1');
        return;
    }
    res.setHeader('Content-Type', 'text/x-shellscript');
    res.send(scriptContent);
});
export default router;
