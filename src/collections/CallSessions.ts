import type { CollectionConfig, Access } from 'payload'

const isAdmin: Access = ({ req }) =>
  Boolean(req.user && 'role' in req.user && req.user.role === 'admin')

export const CallSessions: CollectionConfig = {
  slug: 'call-sessions',
  admin: {
    useAsTitle: 'booking',
    description: 'WebRTC call session records. Created when a call starts, updated when it ends.',
    defaultColumns: ['booking', 'startedAt', 'endedAt'],
  },
  access: {
    create: ({ req }) => Boolean(req.user),
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => isAdmin({ req }),
  },
  fields: [
    {
      name: 'booking',
      type: 'relationship',
      relationTo: 'sessions',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'The booking this call is associated with.',
      },
    },
    {
      name: 'startedAt',
      type: 'date',
      required: true,
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
        description: 'When the call was initiated.',
      },
    },
    {
      name: 'endedAt',
      type: 'date',
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
        description: 'When the call ended. Null if still active.',
      },
    },
  ],
  timestamps: true,
}
