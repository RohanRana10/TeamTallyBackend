const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true
    },
    mode: {
        type: String,
    },
    amount: {
        type: Number,
        required: true
    },
    group: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group'
    }],
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    Date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Payment', paymentSchema);