import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'mentee',
      options: [
        { label: 'Mentor', value: 'mentor' },
        { label: 'Mentee', value: 'mentee' },
      ],
      admin: {
        description: 'Select the user role',
      },
    },
  ],
}
