const router = require('express').Router();
const Alert = require('../models/Alert');
const Server = require('../models/Server');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', async (req, res) => {
    try {
        let filter = {};
        if (!req.isAdmin) {
            const userServers = await Server.find({ userId: req.userId }, '_id');
            const serverIds = userServers.map(s => s._id);
            filter = { server: { $in: serverIds } };
        }
        // Optional: filter by specific server ID
        if (req.query.server) {
            filter.server = req.query.server;
        }
        const limit = req.query.limit ? parseInt(req.query.limit) : 100;
        const alerts = await Alert.find(filter).sort('-createdAt').limit(limit);
        res.json(alerts);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
