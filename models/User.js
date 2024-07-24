const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    image: {
        type: String,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    groups: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group'
    }],
    password: {
        type: String,
        required: true
    },
    Date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', userSchema);