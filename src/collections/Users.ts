import type { CollectionConfig } from 'payload'

const isAdmin = ({ req }: { req: { user?: { role?: string } | null } }) =>
  req.user?.role === 'admin'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  access: {
    // Only admins can log into the Payload admin panel
    admin: isAdmin,
    // Admins can manage any user; users can read/update themselves
    create: ({ req }) => isAdmin({ req }) || Boolean(req.user),
    read: ({ req }) => isAdmin({ req }) || Boolean(req.user),
    update: ({ req }) => isAdmin({ req }) || Boolean(req.user),
    delete: ({ req }) => isAdmin({ req }),
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      admin: {
        condition: (data) => Boolean(data?.id),
      },
    },
    {
      name: 'role',
      type: 'select',
      defaultValue: 'admin',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Mentor', value: 'mentor' },
        { label: 'Mentee', value: 'mentee' },
      ],
      // Only show on edit forms (data.id exists); hidden on all create forms including create-first-user
      admin: {
        condition: (data) => Boolean(data?.id),
        description: 'Select the user role. Only admins can change this.',
      },
      access: {
        create: () => true,
        update: isAdmin,
      },
    },
  ],
}
