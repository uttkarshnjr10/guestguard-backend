// src/models/User.model.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'username is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    email: {
      type: String,
      required: [true, 'email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'password is required'],
      minlength: [6, 'password must be at least 6 characters long'],
      select: false, // hide password from queries by default
    },
    role: {
      type: String,
      required: true,
      enum: ['Hotel', 'Police', 'Regional Admin'],
    },
    details: {
      // hotel-specific fields
      hotelName: { type: String, trim: true },
      city: { type: String, trim: true },
      address: { type: String, trim: true },
      phone: { type: String, trim: true },
      
      // police-specific fields
      jurisdiction: { type: String, trim: true },
      serviceId: { type: String, trim: true },
      rank: { type: String, trim: true },
      station: { type: String, trim: true },
    },
    policeStation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PoliceStation',
      required: function () {
        return this.role === 'Police';
      },
    },
    passwordChangeRequired: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Suspended'],
      default: 'Active',
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;