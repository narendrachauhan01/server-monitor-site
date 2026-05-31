const router = require('express').Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/adminController');

function adminOnly(req, res, next) {
    if (!req.isAdmin) return res.status(403).json({ error: 'Admin only' });
    next();
}

router.get('/users',                auth, adminOnly, ctrl.getUsers);
router.put('/users/:id',            auth, adminOnly, ctrl.updateUser);
router.delete('/users/:id',         auth, adminOnly, ctrl.deleteUser);
router.get('/servers',              auth, adminOnly, ctrl.getServers);
router.get('/settings',             auth, adminOnly, ctrl.getSettings);
router.put('/settings',             auth, adminOnly, ctrl.updateSettings);
router.get('/payments',             auth, adminOnly, ctrl.getPayments);
router.delete('/payments/:id',      auth, adminOnly, ctrl.deletePayment);
router.put('/payments/:id/approve', auth, adminOnly, ctrl.approvePayment);
router.put('/payments/:id/reject',  auth, adminOnly, ctrl.rejectPayment);
router.post('/clear-cache',         auth, adminOnly, ctrl.clearCache);

// Support tickets — admin
router.get('/support-tickets',              auth, adminOnly, async (req, res) => {
    const SupportTicket = require('../models/SupportTicket');
    res.json(await SupportTicket.find().sort('-createdAt'));
});
router.put('/support-tickets/:id',          auth, adminOnly, async (req, res) => {
    const SupportTicket = require('../models/SupportTicket');
    const { status, priority } = req.body;
    const t = await SupportTicket.findByIdAndUpdate(req.params.id, { status, priority }, { new: true });
    res.json(t);
});
router.post('/support-tickets/:id/reply',   auth, adminOnly, async (req, res) => {
    const SupportTicket = require('../models/SupportTicket');
    const t = await SupportTicket.findById(req.params.id);
    if (!t) return res.status(404).json({ error: 'Not found' });
    t.replies.push({ from: 'admin', message: req.body.message });
    t.status = 'in_progress';
    await t.save();
    res.json(t);
});
router.delete('/support-tickets/:id',       auth, adminOnly, async (req, res) => {
    const SupportTicket = require('../models/SupportTicket');
    await SupportTicket.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

module.exports = router;
