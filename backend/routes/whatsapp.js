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
    const provider = process.env.WA_PROVIDER || 'greenapi';
    const base     = wa.getStatus();
    const state    = provider === 'greenapi' ? await wa.getInstanceState() : null;
    res.json({
        ...base,
        provider,
        instanceState: state?.stateInstance || null,
        instanceId:    process.env.GREEN_API_INSTANCE || '',
        hasToken:      !!(process.env.GREEN_API_TOKEN && process.env.GREEN_API_TOKEN !== 'your_token_here'),
        twilioSid:     process.env.TWILIO_ACCOUNT_SID ? process.env.TWILIO_ACCOUNT_SID.slice(0,8)+'...' : '',
        aisensyKey:    process.env.AISENSY_API_KEY ? process.env.AISENSY_API_KEY.slice(0,8)+'...' : '',
    });
});

// Save credentials (admin only) — multi-provider
router.post('/config', auth, adminOnly, async (req, res) => {
    try {
        const { provider, instanceId, apiToken, accountSid, authToken, fromNumber, apiKey, apiUrl } = req.body;
        if (!provider) return res.status(400).json({ error: 'Provider required' });

        updateEnv('WA_PROVIDER', provider);

        if (provider === 'greenapi') {
            if (!instanceId || !apiToken) return res.status(400).json({ error: 'Instance ID and API Token required' });
            updateEnv('GREEN_API_INSTANCE', instanceId);
            updateEnv('GREEN_API_TOKEN', apiToken);
        } else if (provider === 'twilio') {
            if (!accountSid || !authToken || !fromNumber) return res.status(400).json({ error: 'Account SID, Auth Token and From Number required' });
            updateEnv('TWILIO_ACCOUNT_SID', accountSid);
            updateEnv('TWILIO_AUTH_TOKEN', authToken);
            updateEnv('TWILIO_WHATSAPP_FROM', fromNumber);
        } else if (provider === 'aisensy') {
            if (!apiKey) return res.status(400).json({ error: 'API Key required' });
            updateEnv('AISENSY_API_KEY', apiKey);
            if (apiUrl) updateEnv('AISENSY_API_URL', apiUrl);
        }

        res.json({ success: true, provider });
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
