import type { CollectionConfig, Access } from 'payload'

const isAdmin: Access = ({ req }) =>
  Boolean(req.user && 'role' in req.user && req.user.role === 'admin')

export const Availability: CollectionConfig = {
  slug: 'availability',
  admin: {
    useAsTitle: 'mentor',
    description: 'Mentor availability slots. Each document is a bookable time window.',
    group: 'Profiles',
    defaultColumns: ['mentor', 'startTime', 'endTime'],
  },
  access: {
    read: () => true,
    create: ({ req }) => isAdmin({ req }) || Boolean(req.user),
    update: ({ req }) => isAdmin({ req }) || Boolean(req.user),
    delete: ({ req }) => isAdmin({ req }) || Boolean(req.user),
  },
  fields: [
    {
      name: 'mentor',
      type: 'relationship',
      relationTo: 'mentors',
      required: true,
      index: true,
      admin: {
        description: 'The mentor profile this slot belongs to.',
      },
    },
    {
      name: 'startTime',
      type: 'date',
      required: true,
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        description: 'Start of available window.',
      },
    },
    {
      name: 'endTime',
      type: 'date',
      required: true,
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        description: 'End of available window.',
      },
    },
    {
      name: 'isBooked',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'True once a confirmed booking is attached to this slot.',
        readOnly: true,
      },
    },
  ],
  timestamps: true,
}
