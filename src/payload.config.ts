import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { mcpPlugin } from '@payloadcms/plugin-mcp'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { Users } from './collections/Users'
import { Media } from './collections/Media'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media],
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
      collections: {
        users: {
          enabled: {
            find: true,
            create: true,
            update: true,
            delete: true,
          },
          description:
            'Platform users — each user has a role of either "mentor" or "mentee", along with their name and email.',
        },
        media: {
          enabled: {
            find: true,
            create: true,
            update: true,
            delete: true,
          },
          description: 'Uploaded media files and images used across the platform.',
        },
      },
      mcp: {
        tools: [
          {
            name: 'getMentors',
            description: 'List the first 20 users with the mentor role, returning their id, name, and email.',
            parameters: {},
            handler: async (_args, req) => {
              const { payload } = req
              const result = await payload.find({
                collection: 'users',
                where: { role: { equals: 'mentor' } },
                limit: 20,
                req,
                overrideAccess: false,
                user: req.user,
              })
              return {
                content: [
                  {
                    type: 'text' as const,
                    text: JSON.stringify(
                      result.docs.map(({ id, name, email }) => ({ id, name, email })),
                      null,
                      2,
                    ),
                  },
                ],
              }
            },
          },
          {
            name: 'getMentees',
            description: 'List the first 20 users with the mentee role, returning their id, name, and email.',
            parameters: {},
            handler: async (_args, req) => {
              const { payload } = req
              const result = await payload.find({
                collection: 'users',
                where: { role: { equals: 'mentee' } },
                limit: 20,
                req,
                overrideAccess: false,
                user: req.user,
              })
              return {
                content: [
                  {
                    type: 'text' as const,
                    text: JSON.stringify(
                      result.docs.map(({ id, name, email }) => ({ id, name, email })),
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
