import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User, Registration } from './models.js';
import { sendOtpEmail, sendRegistrationEmail } from './mailer.js';

const app = express();
const port = process.env.PORT || 5000;
const jwtSecret = process.env.JWT_SECRET || 'development-secret-change-me';
app.use(cors({ origin: process.env.CLIENT_URL || true }));
app.use(express.json());

const tokenFor = (user) => jwt.sign({ id: user._id, email: user.email }, jwtSecret, { expiresIn: '7d' });
const otpHash = (otp) => crypto.createHash('sha256').update(otp).digest('hex');
const createOtp = () => String(Math.floor(100000 + Math.random() * 900000));
const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'Authentication required.' });
    req.user = jwt.verify(token, jwtSecret);
    next();
  } catch { res.status(401).json({ message: 'Invalid or expired token.' }); }
};

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    if (!fullName || fullName.trim().length < 3 || !/^[A-Za-z ]+$/.test(fullName)) return res.status(400).json({ message: 'Enter a valid full name.' });
    if (!/^\S+@\S+\.\S+$/.test(email || '') || (password || '').length < 8) return res.status(400).json({ message: 'Use a valid email and password of at least 8 characters.' });
    let user = await User.findOne({ email: email.toLowerCase() });
    if (user?.isVerified) return res.status(409).json({ message: 'An account with this email already exists.' });
    const otp = createOtp();
    const fields = { fullName: fullName.trim(), email: email.toLowerCase(), password: await bcrypt.hash(password, 12), otpHash: otpHash(otp), otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000), isVerified: false };
    user = user ? await User.findByIdAndUpdate(user._id, fields, { new: true }) : await User.create(fields);
    await sendOtpEmail(user.email, otp);
    res.status(201).json({ message: 'Verification code sent.', email: user.email, demoOtp: process.env.NODE_ENV === 'production' ? undefined : otp });
  } catch (error) { res.status(500).json({ message: error.message }); }
});
app.post('/api/auth/verify-otp', async (req, res) => {
  const user = await User.findOne({ email: req.body.email?.toLowerCase() });
  if (!user || user.otpExpiresAt < new Date() || user.otpHash !== otpHash(req.body.otp || '')) return res.status(400).json({ message: 'The code is invalid or expired.' });
  user.isVerified = true; user.otpHash = undefined; user.otpExpiresAt = undefined; await user.save();
  res.json({ message: 'Email verified successfully.' });
});
app.post('/api/auth/resend-otp', async (req, res) => {
  const user = await User.findOne({ email: req.body.email?.toLowerCase() });
  if (!user || user.isVerified) return res.status(400).json({ message: 'Unable to resend code.' });
  const otp = createOtp(); user.otpHash = otpHash(otp); user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); await user.save(); await sendOtpEmail(user.email, otp);
  res.json({ message: 'A fresh code was sent.', demoOtp: process.env.NODE_ENV === 'production' ? undefined : otp });
});
app.post('/api/auth/login', async (req, res) => {
  const user = await User.findOne({ email: req.body.email?.toLowerCase() });
  if (!user || !user.isVerified || !(await bcrypt.compare(req.body.password || '', user.password))) return res.status(401).json({ message: 'Invalid credentials or unverified account.' });
  res.json({ token: tokenFor(user), user: { id: user._id, fullName: user.fullName, email: user.email } });
});
app.get('/api/user/me', auth, async (req, res) => { const user = await User.findById(req.user.id).select('-password -otpHash'); res.json({ user }); });
app.put('/api/user/update', auth, async (req, res) => { const user = await User.findByIdAndUpdate(req.user.id, { fullName: req.body.fullName }, { new: true }).select('-password -otpHash'); res.json({ user }); });
app.post('/api/hackathon/register', auth, async (req, res) => {
  try {
    if (await Registration.exists({ user: req.user.id })) return res.status(409).json({ message: 'You already have a registration.' });
    const registration = await Registration.create({ ...req.body, user: req.user.id }); await sendRegistrationEmail(registration); res.status(201).json({ registration });
  } catch (error) { res.status(400).json({ message: error.message }); }
});
app.get('/api/hackathon/my-entry', auth, async (req, res) => res.json({ registration: await Registration.findOne({ user: req.user.id }) }));
app.put('/api/hackathon/:id', auth, async (req, res) => res.json({ registration: await Registration.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, req.body, { new: true, runValidators: true }) }));
app.delete('/api/hackathon/:id', auth, async (req, res) => { await Registration.findOneAndDelete({ _id: req.params.id, user: req.user.id }); res.json({ message: 'Registration deleted.' }); });
app.use((error, _req, res, _next) => res.status(500).json({ message: error.message || 'Server error.' }));

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/matrucare')
  .then(() => app.listen(port, () => console.log(`MatruCare API listening on ${port}`)))
  .catch((error) => { console.error(`MongoDB connection failed: ${error.message}`); app.listen(port, () => console.log(`MatruCare API listening on ${port} without database`)); });
