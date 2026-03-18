import { betterAuth } from 'better-auth'
import { mongodbAdapter } from 'better-auth/adapters/mongodb'
import client from './mongo'

export const auth = betterAuth({
  database: mongodbAdapter(client.db()),
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
  },
  user: {
    // Write directly to Payload's 'users' collection instead of a separate 'user' collection.
    // This eliminates the duplicate and keeps one source of truth in MongoDB.
    modelName: 'users',
    additionalFields: {
      role: {
        type: 'string',
        required: true,
        defaultValue: 'mentee',
        input: true,
      },
    },
  },
  trustedOrigins: [process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'],
})

export type Session = typeof auth.$Infer.Session
