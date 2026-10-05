import jwt from 'jsonwebtoken';
import { User, UserRole } from '../models/User.js';
import { env } from '../config/env.js';

export const authService = {
  /**
   * Authenticates user via email and password, returning JWT and sanitized profile.
   *
   * @param {string} email
   * @param {string} password
   */
  async login(email, password) {
    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .select('+passwordHash')
      .exec();

    if (!user) {
      const err = new Error('Invalid email or password');
      err.statusCode = 401;
      err.errorCode = 'INVALID_CREDENTIALS';
      throw err;
    }

    if (!user.isActive) {
      const err = new Error('Account has been deactivated. Please contact support.');
      err.statusCode = 403;
      err.errorCode = 'ACCOUNT_DEACTIVATED';
      throw err;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      const err = new Error('Invalid email or password');
      err.statusCode = 401;
      err.errorCode = 'INVALID_CREDENTIALS';
      throw err;
    }

    const tokenPayload = {
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
    };

    const token = jwt.sign(tokenPayload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    });

    return {
      token,
      user: {
        _id: user._id.toString(),
        userId: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company,
      },
    };
  },

  /**
   * Creates a new client account.
   *
   * @param {object} clientData
   */
  async createClient(clientData) {
    const existing = await User.findOne({ email: clientData.email.toLowerCase().trim() });
    if (existing) {
      const err = new Error(`User with email '${clientData.email}' already exists`);
      err.statusCode = 409;
      err.errorCode = 'EMAIL_ALREADY_EXISTS';
      throw err;
    }

    const newUser = new User({
      name: clientData.name.trim(),
      email: clientData.email.toLowerCase().trim(),
      passwordHash: clientData.password,
      role: UserRole.CLIENT,
      company: clientData.company || 'Enterprise Client',
      isActive: true,
    });

    const saved = await newUser.save();
    return {
      _id: saved._id.toString(),
      userId: saved._id.toString(),
      name: saved.name,
      email: saved.email,
      role: saved.role,
      company: saved.company,
      createdAt: saved.createdAt,
    };
  },

  /**
   * Retrieves profile by ID.
   *
   * @param {string} userId
   */
  async getProfile(userId) {
    const user = await User.findById(userId).lean();
    if (!user) {
      const err = new Error('User profile not found');
      err.statusCode = 404;
      err.errorCode = 'USER_NOT_FOUND';
      throw err;
    }
    return {
      _id: user._id.toString(),
      userId: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      company: user.company,
    };
  },

  /**
   * Lists all client accounts (Admin only).
   */
  async listClients() {
    const clients = await User.find({ role: UserRole.CLIENT })
      .select('_id name email company isActive createdAt')
      .sort({ createdAt: -1 })
      .lean();

    return clients.map((c) => ({
      _id: c._id.toString(),
      clientId: c._id.toString(),
      name: c.name,
      email: c.email,
      company: c.company,
      isActive: c.isActive,
      createdAt: c.createdAt,
    }));
  },
};

export default authService;
