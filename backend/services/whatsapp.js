/**
 * WhatsApp Service — Green API (https://green-api.com)
 * OPTIONAL: if GREEN_API_INSTANCE + GREEN_API_TOKEN not set in .env,
 * WhatsApp alerts are silently skipped. App runs normally without it.
 *
 * Hot-reload: watches .env file — new credentials are auto-detected,
 * no backend restart required.
 */

const https  = require('https');
const fs     = require('fs');
const path   = require('path');
const dotenv = require('dotenv');

const ENV_PATH = path.resolve(__dirname, '../.env');

// Re-read .env into process.env (override existing values)
function reloadEnv() {
    try {
        dotenv.config({ path: ENV_PATH, override: true });
    } catch (_) {}
}

// Watch .env file — reload when saved
let watchDebounce = null;
fs.watch(ENV_PATH, () => {
    clearTimeout(watchDebounce);
    watchDebounce = setTimeout(() => {
        const wasBefore = isConfigured();
        reloadEnv();
        const isNow = isConfigured();
        if (!wasBefore && isNow) {
            console.log(`[WhatsApp] ✅ Credentials detected — Green API enabled (instance ${process.env.GREEN_API_INSTANCE})`);
        } else if (wasBefore && !isNow) {
            console.log('[WhatsApp] ⚠️  Credentials removed — WhatsApp alerts disabled');
        }
    }, 500);
});

// ─────────────────────────────────────────────────────────────
function isConfigured() {
    return !!(process.env.GREEN_API_INSTANCE && process.env.GREEN_API_TOKEN);
}

function formatPhone(phone) {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) return `91${digits}@c.us`;
    if (digits.length === 12 && digits.startsWith('91')) return `${digits}@c.us`;
    return `${digits}@c.us`;
}

function httpPost(url, body, extraHeaders = {}) {
    return new Promise((resolve, reject) => {
        const u       = new URL(url);
        const payload = typeof body === 'string' ? body : JSON.stringify(body);
        const ct      = typeof body === 'string' ? 'application/x-www-form-urlencoded' : 'application/json';
        const req     = https.request({
            hostname: u.hostname,
            path:     u.pathname + (u.search || ''),
            method:   'POST',
            headers:  { 'Content-Type': ct, 'Content-Length': Buffer.byteLength(payload), ...extraHeaders },
        }, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => { try { resolve(JSON.parse(data)); } catch { resolve({ raw: data }); } });
        });
        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}

async function sendMessage(phone, message) {
    if (!isConfigured()) {
        console.log('[WhatsApp] Not configured — skipping alert');
        return;
    }

    const provider = process.env.WA_PROVIDER || 'greenapi';

    try {
        if (provider === 'twilio') {
            // Twilio WhatsApp
            const { TWILIO_ACCOUNT_SID: sid, TWILIO_AUTH_TOKEN: authToken, TWILIO_WHATSAPP_FROM: from } = process.env;
            if (!sid || !authToken || !from) { console.warn('[WhatsApp] Twilio not configured'); return; }
            const digits = phone.replace(/\D/g, '');
            const to = digits.startsWith('91') ? `+${digits}` : `+91${digits}`;
            const creds = Buffer.from(`${sid}:${authToken}`).toString('base64');
            const body = new URLSearchParams({ From: `whatsapp:${from}`, To: `whatsapp:${to}`, Body: message });
            const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
            const res = await httpPost(url, body.toString(), { 'Authorization': `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' });
            console.log(`[WhatsApp] Twilio sent to ${to} ✓`);
            return res;

        } else if (provider === 'aisensy') {
            // AiSensy
            const { AISENSY_API_KEY: key, AISENSY_API_URL: apiUrl = 'https://backend.aisensy.com/campaign/t1/api/v2' } = process.env;
            if (!key) { console.warn('[WhatsApp] AiSensy not configured'); return; }
            const digits = phone.replace(/\D/g, '');
            const to = digits.startsWith('91') ? digits : `91${digits}`;
            const body = { apiKey: key, campaignName: 'UptimeForge Alert', destination: to, userName: 'UptimeForge', source: 'UptimeForge', media: {}, templateParams: [message], tags: [], attributes: {} };
            const res = await httpPost(apiUrl, body);
            console.log(`[WhatsApp] AiSensy sent to ${to} ✓`);
            return res;

        } else {
            // Default: Green API
            const { GREEN_API_INSTANCE: id, GREEN_API_TOKEN: token } = process.env;
            const url    = `https://api.green-api.com/waInstance${id}/sendMessage/${token}`;
            const chatId = formatPhone(phone);
            const result = await httpPost(url, { chatId, message });
            if (result.idMessage) {
                console.log(`[WhatsApp] Green API sent to ${phone} ✓ (${result.idMessage})`);
            } else {
                console.warn('[WhatsApp] Green API send failed:', JSON.stringify(result));
            }
            return result;
        }
    } catch (e) {
        console.error(`[WhatsApp] ${provider} error:`, e.message);
    }
}

async function getInstanceState() {
    if (!isConfigured()) return null;
    const { GREEN_API_INSTANCE: id, GREEN_API_TOKEN: token } = process.env;
    const url = `https://api.green-api.com/waInstance${id}/getStateInstance/${token}`;
    return new Promise((resolve) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => { try { resolve(JSON.parse(data)); } catch { resolve(null); } });
        }).on('error', () => resolve(null));
    });
}

function getStatus() {
    if (!isConfigured()) return { status: 'not_configured' };
    return { status: 'ready', instance: process.env.GREEN_API_INSTANCE };
}

function init() {
    if (isConfigured()) {
        console.log(`[WhatsApp] Green API ready — instance ${process.env.GREEN_API_INSTANCE}`);
    } else {
        console.log('[WhatsApp] Green API not configured — WhatsApp alerts disabled (optional)');
        console.log('[WhatsApp] Add GREEN_API_INSTANCE + GREEN_API_TOKEN to .env — auto-detected on save, no restart needed');
    }
}

module.exports = { init, sendMessage, getStatus, getInstanceState, isConfigured };
