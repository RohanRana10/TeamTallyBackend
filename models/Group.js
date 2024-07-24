const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    name: {
        type: String,
        required: true
    },
    image: {
        type: String,
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    payments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment'
    }],
    Date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Group', groupSchema);