"use server"

import mongoose from 'mongoose';
import { Logger } from '@/lib/logger';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

let cached: MongooseCache = (globalThis as any).mongoose;

if (!cached) {
  cached = (globalThis as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 30000,
      maxPoolSize: 10,
      minPoolSize: 1,
      connectTimeoutMS: 15000,
    };

    try {
      cached.promise = mongoose.connect(MONGODB_URI!, opts);
      
      mongoose.connection.on('connected', async () => {
        await Logger.info('MongoDB connection established', {
          service: 'MongoDB',
          action: 'CONNECT'
        });
      });

      mongoose.connection.on('error', async (err) => {
        await Logger.error('MongoDB connection error', {
          error: err instanceof Error ? err.message : 'Unknown error',
          service: 'MongoDB'
        });
      });

      mongoose.connection.on('disconnected', async () => {
        await Logger.warning('MongoDB disconnected', {
          service: 'MongoDB',
          action: 'DISCONNECT'
        });
      });

      await cached.promise;
      
    } catch (error) {
      await Logger.error('MongoDB connection failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        service: 'MongoDB'
      });
      cached.promise = null;
      throw error;
    }
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    await Logger.error('MongoDB cached connection failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      service: 'MongoDB'
    });
    throw error;
  }

  return cached.conn;
}

export default dbConnect;
