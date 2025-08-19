// models/User.model.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        lowercase: true,
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address'],
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long'],
        select: false, // Security Best Practice: Hide password from queries by default
    },
    role: {
        type: String,
        required: true,
        // UPDATED: 'Super Admin' is removed
        enum: ['Hotel', 'Police', 'Regional Admin'], 
    },
    // NEW: This flag forces a password change after the first login
    passwordChangeRequired: {
        type: Boolean,
        default: true,
    },
    memberSince: {
        type: Date,
        default: Date.now,
    },
     status: {
        type: String,
        enum: ['Active', 'Suspended'],
        default: 'Active',
    },
});

// This "pre-save hook" automatically hashes the password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// This method securely compares the entered password with the stored one
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;