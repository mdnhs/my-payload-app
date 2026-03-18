import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { mcpPlugin } from '@payloadcms/plugin-mcp'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Mentors } from './collections/Mentors'
import { Mentees } from './collections/Mentees'
import { Sessions } from './collections/Sessions'
import { Messages } from './collections/Messages'
import { Transactions } from './collections/Transactions'
import { Availability } from './collections/Availability'
import { CallSessions } from './collections/CallSessions'
import { Withdrawals } from './collections/Withdrawals'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Mentors, Mentees, Sessions, Messages, Transactions, Availability, CallSessions, Withdrawals],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URL || '',
  }),
  sharp,
  plugins: [
    mcpPlugin({
      overrideAuth: async (req, getDefault) => {
        try {
          return await getDefault()
        } catch {
          // Fallback: allow read-only access when MCP API key auth fails
          return {
            user: req.user ?? null,
            collections: {},
          } as Awaited<ReturnType<typeof getDefault>>
        }
      },
      collections: {
        users: {
          enabled: { find: true, create: true, update: true, delete: true },
          description: 'Auth accounts — each user has a role field ("mentor" | "mentee"). The actual profile data lives in the mentors or mentees collection.',
        },
        mentors: {
          enabled: { find: true, create: true, update: true, delete: true },
          description: 'Mentor profiles — rich profile data including headline, bio, skills, hourlyRate, rating, availability, and earnings stats. One document per mentor user.',
        },
        mentees: {
          enabled: { find: true, create: true, update: true, delete: true },
          description: 'Mentee profiles — learning goals, experience level, interests, timezone, and progress stats. One document per mentee user.',
        },
        media: {
          enabled: { find: true, create: true, update: true, delete: true },
          description: 'Uploaded media files and images used across the platform.',
        },
      },
      mcp: {
        tools: [
          {
            name: 'getMentorProfiles',
            description: 'List mentor profiles with their headline, category, hourlyRate, rating, and skills.',
            parameters: {},
            handler: async (_args, req) => {
              const { payload } = req
              const result = await payload.find({
                collection: 'mentors',
                limit: 20,
                depth: 1,
                req,
                overrideAccess: false,
                user: req.user,
              })
              return {
                content: [
                  {
                    type: 'text' as const,
                    text: JSON.stringify(
                      result.docs.map(({ id, headline, category, hourlyRate, rating, reviewCount, isVerified, isAvailable }) => ({
                        id, headline, category, hourlyRate, rating, reviewCount, isVerified, isAvailable,
                      })),
                      null,
                      2,
                    ),
                  },
                ],
              }
            },
          },
          {
            name: 'getMenteeProfiles',
            description: 'List mentee profiles with their target role, experience level, and learning goals.',
            parameters: {},
            handler: async (_args, req) => {
              const { payload } = req
              const result = await payload.find({
                collection: 'mentees',
                limit: 20,
                depth: 1,
                req,
                overrideAccess: false,
                user: req.user,
              })
              return {
                content: [
                  {
                    type: 'text' as const,
                    text: JSON.stringify(
                      result.docs.map(({ id, targetRole, experienceLevel, weeklyGoalHours, totalSessions, currentStreak }) => ({
                        id, targetRole, experienceLevel, weeklyGoalHours, totalSessions, currentStreak,
                      })),
                      null,
                      2,
                    ),
                  },
                ],
              }
            },
          },
        ],
      },
    }),
  ],
})
