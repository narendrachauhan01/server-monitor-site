const mongoose = require('mongoose');

const serverMetricSchema = new mongoose.Schema({
    serverId: { type: String, required: true },
    serverName: { type: String, required: true },
    hostname: { type: String },
    cpu: { type: Number },           // percentage 0-100
    ramUsed: { type: Number },       // bytes
    ramTotal: { type: Number },      // bytes
    diskUsed: { type: Number },      // bytes
    diskTotal: { type: Number },     // bytes
    uptime: { type: Number },        // seconds
    platform: { type: String },
    timestamp: { type: Date, default: Date.now },
}, { timestamps: false });

// Keep last 24 hours only (auto cleanup)
serverMetricSchema.index({ timestamp: 1 }, { expireAfterSeconds: 86400 });
serverMetricSchema.index({ serverId: 1, timestamp: -1 });

module.exports = mongoose.model('ServerMetric', serverMetricSchema);
