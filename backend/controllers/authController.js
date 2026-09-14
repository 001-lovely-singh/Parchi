const crypto = require('crypto');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const generateClinicCode = require('../utils/generateClinicCode');
const { sendResetEmail } = require('../services/emailService');

exports.signup = async (req, res) => {
  try {
    const { role, name, email, password, dateOfBirth, gender, clinicName } = req.body;

    if (!role || !['patient', 'clinic'].includes(role)) {
      return res.status(400).json({ message: 'role must be "patient" or "clinic"' });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const userData = { name, email, password, role };

    if (role === 'patient') {
      if (!dateOfBirth || !gender) {
        return res.status(400).json({ message: 'dateOfBirth and gender are required for patient signup' });
      }
      userData.dateOfBirth = dateOfBirth;
      userData.gender = gender;
    } else {
      if (!clinicName) {
        return res.status(400).json({ message: 'clinicName is required for clinic signup' });
      }
      userData.clinicName = clinicName;
      userData.clinicCode = generateClinicCode();
    }

    const user = await User.create(userData);
    const token = generateToken(user._id, user.role);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        clinicCode: user.clinicCode || undefined
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Signup failed', error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id, user.role);
    res.json({
      token,
      user: { id: user._id, name: user.name, role: user.role, clinicCode: user.clinicCode || undefined }
    });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(200).json({ message: 'If that email exists, a reset link was sent' }); // user-enumeration guard

    const rawToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 min
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${rawToken}`;
    await sendResetEmail(user.email, resetUrl);

    res.json({ message: 'If that email exists, a reset link was sent' });
  } catch (err) {
    res.status(500).json({ message: 'Request failed', error: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired reset token' });

    user.password = newPassword; // pre-save hook hash karega
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ message: 'Reset failed', error: err.message });
  }
};