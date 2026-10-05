import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';

/**
 * Serverless function entry point for Vercel deployment.
 * Ensures the singleton database connection is established before processing requests.
 */
export default async function handler(req, res) {
  await connectDB();
  return app(req, res);
}
