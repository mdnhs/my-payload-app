import { betterAuth } from 'better-auth'
import { mongodbAdapter } from 'better-auth/adapters/mongodb'
import { mcp } from 'better-auth/plugins'
import { MongoClient } from 'mongodb'

const client = new MongoClient(process.env.DATABASE_URL!)

export const auth = betterAuth({
  database: mongodbAdapter(client.db()),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: true,
        defaultValue: 'mentee',
        input: true,
      },
      name: {
        type: 'string',
        required: true,
        input: true,
      },
    },
  },
  plugins: [
    mcp({
      loginPage: '/login',
    }),
  ],
  trustedOrigins: [process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'],
})

export type Session = typeof auth.$Infer.Session
