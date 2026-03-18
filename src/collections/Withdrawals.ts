import type { CollectionConfig, Access } from 'payload'

const isAdmin: Access = ({ req }) =>
  Boolean(req.user && 'role' in req.user && req.user.role === 'admin')

export const Withdrawals: CollectionConfig = {
  slug: 'withdrawals',
  admin: {
    useAsTitle: 'mentorUser',
    description: 'Mentor payout/withdrawal requests after session completion.',
    defaultColumns: ['mentorUser', 'amount', 'status', 'createdAt'],
  },
  access: {
    create: ({ req }) => Boolean(req.user),
    read: ({ req }) => Boolean(req.user),
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'mentorUser',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
      admin: { description: 'The mentor requesting the withdrawal.' },
    },
    {
      name: 'amount',
      type: 'number',
      required: true,
      min: 1,
      admin: { description: 'Amount requested in USD.' },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Processing', value: 'processing' },
        { label: 'Completed', value: 'completed' },
        { label: 'Rejected', value: 'rejected' },
      ],
    },
    {
      name: 'note',
      type: 'textarea',
      admin: { description: 'Optional note from mentor or admin.' },
    },
  ],
  timestamps: true,
}
