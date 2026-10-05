import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const { Schema } = mongoose;

export const UserRole = Object.freeze({
  ADMIN: 'ADMIN',
  CLIENT: 'CLIENT',
});

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'name is required'],
      trim: true,
      minlength: [2, 'name must be at least 2 characters'],
      maxlength: [100, 'name must not exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    passwordHash: {
      type: String,
      required: [true, 'password is required'],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: Object.values(UserRole),
        message: '{VALUE} is not a supported role',
      },
      default: UserRole.CLIENT,
      uppercase: true,
    },
    company: {
      type: String,
      trim: true,
      default: 'Enterprise Client',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

// Indexes
userSchema.index({ role: 1 });

/**
 * Compares plaintext candidate password with hashed password.
 *
 * @param {string} candidatePassword
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

/**
 * Pre-save middleware to hash passwordHash if newly set or modified.
 */
userSchema.pre('save', async function () {
  if (!this.isModified('passwordHash')) return;
  // If not already a bcrypt hash (starts with $2)
  if (!this.passwordHash.startsWith('$2a$') && !this.passwordHash.startsWith('$2b$')) {
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  }
});

export const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
