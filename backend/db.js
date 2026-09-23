const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoMemoryServer = null;

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/healthcare_appointment';

  try {
    // Attempt standard connection first with 3-second timeout
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`[Database] Connected to MongoDB at ${uri}`);
  } catch (error) {
    console.warn(`[Database] Local MongoDB connection failed (${error.message}). Initializing MongoMemoryServer fallback...`);
    
    try {
      mongoMemoryServer = await MongoMemoryServer.create();
      const memoryUri = mongoMemoryServer.getUri();
      await mongoose.connect(memoryUri);
      console.log(`[Database] Successfully connected to MongoMemoryServer at ${memoryUri}`);
    } catch (memError) {
      console.error('[Database] Failed to initialize MongoMemoryServer:', memError);
      process.exit(1);
    }
  }
}

module.exports = connectDB;
