import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  otpHash: String,
  otpExpiresAt: Date,
  createdAt: { type: Date, default: Date.now }
});

const registrationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  mobile: { type: String, required: true },
  college: { type: String, required: true },
  course: { type: String, required: true },
  branch: { type: String, required: true },
  year: { type: String, required: true },
  domain: { type: String, required: true },
  projectName: { type: String, required: true },
  pptLink: { type: String, required: true },
  prototypeLink: { type: String, required: true },
  demoVideoLink: String,
  teamSize: { type: Number, required: true, min: 1, max: 5 },
  teamMembers: [{ name: String, email: String }]
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
export const Registration = mongoose.model('Registration', registrationSchema);
