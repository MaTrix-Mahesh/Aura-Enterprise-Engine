import mongoose from 'mongoose';
import { env } from './env.js';

let isListenersRegistered = false;

/**
 * Registers one-time event listeners on mongoose connection.
 * Sanitizes output to ensure credentials and secret query params are never logged.
 */
function registerConnectionEvents() {
  if (isListenersRegistered) return;

  mongoose.connection.on('connected', () => {
    const { host, port, name } = mongoose.connection;
    console.log(`[Database] MongoDB connection established successfully on ${host}:${port}/${name}`);
  });

  mongoose.connection.on('error', (err) => {
    console.error(`[Database Error] MongoDB connection error occurred: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[Database Warning] MongoDB connection disconnected');
  });

  isListenersRegistered = true;
}

/**
 * Establishes a singleton Mongoose connection pool for Aura Enterprise Engine.
 * Configured with maxPoolSize: 50 to service high-throughput concurrent workloads.
 *
 * @param {string} [customUri] Optional URI override for testing
 * @returns {Promise<typeof mongoose>}
 */
export async function connectDB(customUri) {
  // If already connected, return existing connection
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  // If currently connecting, wait for it
  if (mongoose.connection.readyState === 2) {
    await new Promise((resolve) => mongoose.connection.once('connected', resolve));
    return mongoose;
  }

  registerConnectionEvents();

  const targetUri = customUri || env.MONGO_URI;

  try {
    await mongoose.connect(targetUri, {
      maxPoolSize: 50,
      serverSelectionTimeoutMS: 5000,
    });
    return mongoose;
  } catch (error) {
    console.error(`[Database Error] Failed to connect to MongoDB: ${error.message}`);
    throw error;
  }
}

/**
 * Gracefully closes the Mongoose connection pool.
 *
 * @returns {Promise<void>}
 */
export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('[Database] MongoDB connection pool closed cleanly');
  }
}

export default connectDB;
