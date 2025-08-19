// models/Remark.model.js
const mongoose = require('mongoose');

const remarkSchema = new mongoose.Schema({
    guest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Guest',
        required: true,
    },
    // The police officer who made the remark
    officer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    text: {
        type: String,
        required: [true, 'Remark text cannot be empty.'],
        trim: true,
    },
}, {
    timestamps: true,
});

const Remark = mongoose.model('Remark', remarkSchema);

module.exports = Remark;