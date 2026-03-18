import { MongoClient } from 'mongodb'

// Shared singleton client used by both Better Auth and sync hooks.
// The driver lazily connects so no explicit .connect() is needed.
const client = new MongoClient(process.env.DATABASE_URL!)

export default client
