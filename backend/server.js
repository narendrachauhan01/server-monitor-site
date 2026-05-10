require('dotenv').config();

// Prevent puppeteer/whatsapp-web.js errors from crashing the process
process.on('unhandledRejection', (reason) => {
    console.error('[Process] Unhandled rejection:', reason?.message || reason);
});
process.on('uncaughtException', (err) => {
    console.error('[Process] Uncaught exception:', err.message);
});

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');

const wa = require('./services/whatsapp');
const monitor = require('./services/monitor');

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, { cors: { origin: process.env.FRONTEND_URL || '*' } });

app.use(cors());
app.use(express.json());

app.use('/api/servers', require('./routes/servers'));
app.use('/api/recipients', require('./routes/recipients'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/whatsapp', require('./routes/whatsapp'));
app.use('/api/expiry', require('./routes/expiry'));
app.use('/api/email-config', require('./routes/emailConfig'));
app.use('/api/metrics', require('./routes/metrics'));

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('[DB] MongoDB connected');
        wa.init(io);
        monitor.start();
    })
    .catch(e => { console.error('[DB] Connection failed:', e.message); process.exit(1); });

const PORT = process.env.PORT || 5001;
httpServer.listen(PORT, () => console.log(`[Server] Running on port ${PORT}`));
