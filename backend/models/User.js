const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },

    // role ka koi default nahi — signup form pe explicitly select karna hoga
    role: {
      type: String,
      enum: ['patient', 'clinic'],
      required: [true, 'Role is required (patient or clinic)']
    },

    // ---- patient-only fields ----
    dateOfBirth: {
      type: Date,
      required: function () {
        return this.role === 'patient';
      }
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: function () {
        return this.role === 'patient';
      }
    },

    // ---- clinic-only fields ----
    clinicName: {
      type: String,
      trim: true,
      required: function () {
        return this.role === 'clinic';
      }
    },
    clinicCode: {
      type: String,
      unique: true,
      sparse: true, // sirf clinic docs me hoga, patient docs me null rahega
      required: function () {
        return this.role === 'clinic';
      }
    },

    // ---- forgot password ----
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date }
  },
  { timestamps: true }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);