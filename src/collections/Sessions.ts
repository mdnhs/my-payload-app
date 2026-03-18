import type { CollectionConfig } from 'payload'

export const Sessions: CollectionConfig = {
  slug: 'sessions',
  admin: {
    useAsTitle: 'topic',
  },
  access: {
    create: ({ req }) => Boolean(req.user),
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => req.user?.role === 'admin',
  },
  fields: [
    {
      name: 'mentor',
      type: 'relationship',
      relationTo: 'mentors',
      required: true,
    },
    {
      name: 'mentee',
      type: 'relationship',
      relationTo: 'mentees',
      required: true,
    },
    {
      name: 'mentorUser',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'menteeUser',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'topic',
      type: 'text',
      required: true,
      maxLength: 200,
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'scheduledAt',
      type: 'date',
      required: true,
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'duration',
      type: 'number',
      required: true,
      defaultValue: 60,
      min: 15,
      max: 180,
      admin: {
        description: 'Duration in minutes',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Confirmed', value: 'confirmed' },
        { label: 'Completed', value: 'completed' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
    },
    {
      name: 'hourlyRate',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description: 'Rate snapshot at booking time (USD)',
      },
    },
    {
      name: 'amountCharged',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description: 'Total charged to mentee (USD)',
      },
    },
    {
      name: 'paymentStatus',
      type: 'select',
      defaultValue: 'paid',
      options: [
        { label: 'Paid', value: 'paid' },
        { label: 'Pending', value: 'pending' },
        { label: 'Refunded', value: 'refunded' },
      ],
    },
    {
      name: 'meetingLink',
      type: 'text',
    },
    {
      name: 'notes',
      type: 'textarea',
    },
    {
      name: 'rating',
      type: 'number',
      min: 0,
      max: 5,
    },
    {
      name: 'review',
      type: 'textarea',
    },
  ],
  timestamps: true,
}
