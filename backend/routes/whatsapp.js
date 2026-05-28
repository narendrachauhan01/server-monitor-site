const router = require('express').Router();
const wa     = require('../services/whatsapp');
const auth   = require('../middleware/auth');
const fs     = require('fs');
const path   = require('path');

const ENV_PATH = path.join(__dirname, '../.env');

function updateEnv(key, value) {
    let content = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf8') : '';
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(content)) {
        content = content.replace(regex, `${key}=${value}`);
    } else {
        content += `\n${key}=${value}`;
    }
    fs.writeFileSync(ENV_PATH, content);
    process.env[key] = value;
}

// Admin only middleware
const adminOnly = (req, res, next) => {
    if (!req.isAdmin) return res.status(403).json({ error: 'Admin only' });
    next();
};

// Status
router.get('/status', auth, async (req, res) => {
    const base  = wa.getStatus();
    const state = await wa.getInstanceState();
    res.json({
        ...base,
        instanceState: state?.stateInstance || null,
        instanceId: process.env.GREEN_API_INSTANCE || '',
        hasToken: !!(process.env.GREEN_API_TOKEN && process.env.GREEN_API_TOKEN !== 'your_token_here'),
    });
});

// Save credentials (admin only)
router.post('/config', auth, adminOnly, async (req, res) => {
    try {
        const { instanceId, apiToken } = req.body;
        if (!instanceId || !apiToken) return res.status(400).json({ error: 'Instance ID and API Token required' });
        updateEnv('GREEN_API_INSTANCE', instanceId);
        updateEnv('GREEN_API_TOKEN', apiToken);
        // Re-init WhatsApp service with new credentials
        wa.reinit && wa.reinit();
        res.json({ success: true, instanceId });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Test send
router.post('/test', auth, adminOnly, async (req, res) => {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone required' });
    try {
        await wa.sendMessage(phone, '✅ UptimeForge WhatsApp test — connected successfully!');
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
