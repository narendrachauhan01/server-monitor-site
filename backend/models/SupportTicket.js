const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
    from:    { type: String, enum: ['user','admin'], required: true },
    message: { type: String, required: true },
    images:  [{ type: String }], // file paths
    at:      { type: Date, default: Date.now },
});

const supportTicketSchema = new mongoose.Schema({
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    name:     { type: String, required: true },
    email:    { type: String, required: true },
    subject:  { type: String, required: true },
    message:  { type: String, required: true },
    images:   [{ type: String }],
    priority: { type: String, enum: ['low','medium','high'], default: 'medium' },
    status:   { type: String, enum: ['open','in_progress','resolved','closed'], default: 'open' },
    replies:      [replySchema],
    adminUnread:  { type: Boolean, default: false }, // true when user replies
    userUnread:   { type: Boolean, default: false }, // true when admin replies
}, { timestamps: true });

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
