import type { CollectionConfig } from 'payload'

const isAdmin = ({ req }: { req: { user?: { role?: string } | null } }) =>
  req.user?.role === 'admin'

export const Mentors: CollectionConfig = {
  slug: 'mentors',
  admin: {
    useAsTitle: 'headline',
    description: 'Mentor profiles — people studying or living abroad who guide prospective students.',
    group: 'Profiles',
    defaultColumns: ['user', 'headline', 'country', 'university', 'degree', 'isVerified', 'isAvailable'],
  },
  access: {
    read: () => true,
    create: ({ req }) => isAdmin({ req }) || Boolean(req.user),
    update: ({ req }) => isAdmin({ req }) || Boolean(req.user),
    delete: ({ req }) => isAdmin({ req }) || Boolean(req.user),
  },
  fields: [
    // ── Identity ─────────────────────────────────────────────
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      unique: true,
      admin: {
        description: 'The user account that owns this mentor profile.',
        position: 'sidebar',
      },
    },
    {
      name: 'profileImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        position: 'sidebar',
        description: 'Profile photo shown on the discovery page.',
      },
    },
    {
      name: 'isVerified',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Admin-verified mentor badge.',
      },
    },
    {
      name: 'isAvailable',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'Toggle availability for new bookings.',
      },
    },

    // ── Profile ───────────────────────────────────────────────
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Profile',
          fields: [
            {
              name: 'headline',
              type: 'text',
              required: true,
              maxLength: 140,
              admin: {
                description: 'Short headline, e.g. "MS Computer Science @ MIT — Living in USA since 2020".',
                placeholder: 'e.g. MS CS @ MIT — USA since 2020',
              },
            },
            {
              name: 'bio',
              type: 'textarea',
              maxLength: 1000,
              admin: {
                description: 'Tell students about your journey abroad.',
                rows: 5,
              },
            },
            {
              name: 'country',
              type: 'select',
              required: true,
              defaultValue: 'usa',
              options: [
                { label: '🇺🇸 USA', value: 'usa' },
                { label: '🇬🇧 United Kingdom', value: 'uk' },
                { label: '🇨🇦 Canada', value: 'canada' },
                { label: '🇦🇺 Australia', value: 'australia' },
                { label: '🇩🇪 Germany', value: 'germany' },
                { label: '🇫🇷 France', value: 'france' },
                { label: '🇳🇱 Netherlands', value: 'netherlands' },
                { label: '🇸🇪 Sweden', value: 'sweden' },
                { label: '🇯🇵 Japan', value: 'japan' },
                { label: '🇰🇷 South Korea', value: 'south_korea' },
                { label: '🇮🇪 Ireland', value: 'ireland' },
                { label: '🇳🇿 New Zealand', value: 'new_zealand' },
                { label: '🇸🇬 Singapore', value: 'singapore' },
                { label: '🇲🇾 Malaysia', value: 'malaysia' },
                { label: '🇮🇹 Italy', value: 'italy' },
                { label: '🇪🇸 Spain', value: 'spain' },
                { label: '🇨🇭 Switzerland', value: 'switzerland' },
                { label: '🇫🇮 Finland', value: 'finland' },
                { label: '🇩🇰 Denmark', value: 'denmark' },
                { label: '🇳🇴 Norway', value: 'norway' },
                { label: 'Other', value: 'other' },
              ],
              admin: { description: 'Country where you are currently studying or living.' },
            },
            {
              name: 'city',
              type: 'text',
              admin: { placeholder: 'e.g. Boston, New York, London' },
            },
            {
              name: 'university',
              type: 'text',
              admin: {
                placeholder: 'e.g. MIT, University of Oxford',
                description: 'University/institution you attend(ed).',
              },
            },
            {
              name: 'degree',
              type: 'select',
              required: true,
              defaultValue: 'master',
              options: [
                { label: "Bachelor's", value: 'bachelor' },
                { label: "Master's", value: 'master' },
                { label: 'PhD', value: 'phd' },
                { label: 'Postdoc / Researcher', value: 'postdoc' },
                { label: 'Working Professional', value: 'working' },
                { label: 'Language Course', value: 'language' },
              ],
              admin: { description: 'Your current or completed degree level.' },
            },
            {
              name: 'fieldOfStudy',
              type: 'text',
              admin: {
                placeholder: 'e.g. Computer Science, Mechanical Engineering',
                description: 'Your field or major.',
              },
            },
            {
              name: 'yearsAbroad',
              type: 'number',
              min: 0,
              max: 30,
              admin: { description: 'How many years you have been living abroad.' },
            },
            {
              name: 'services',
              type: 'select',
              hasMany: true,
              options: [
                { label: 'University Selection', value: 'university_selection' },
                { label: 'Application Review', value: 'application_review' },
                { label: 'SOP / Essay Review', value: 'sop_review' },
                { label: 'Visa Guidance', value: 'visa_guidance' },
                { label: 'Scholarship Help', value: 'scholarship' },
                { label: 'Interview Preparation', value: 'interview_prep' },
                { label: 'Accommodation Help', value: 'accommodation' },
                { label: 'City & Lifestyle Guide', value: 'lifestyle_guide' },
                { label: 'Part-time Job Guidance', value: 'job_guidance' },
                { label: 'Language Test Prep (IELTS/TOEFL)', value: 'language_test' },
              ],
              admin: { description: 'Services you offer to help students.' },
            },
            {
              name: 'languages',
              type: 'array',
              maxRows: 10,
              fields: [
                {
                  name: 'language',
                  type: 'text',
                  required: true,
                  admin: { placeholder: 'e.g. English, Bengali, Hindi' },
                },
              ],
            },
          ],
        },

        // ── Pricing & Availability ─────────────────────────────
        {
          label: 'Pricing & Availability',
          fields: [
            {
              name: 'introCallFree',
              type: 'checkbox',
              defaultValue: true,
              admin: { description: 'Offer a free 15-min intro call for new students.' },
            },
            {
              name: 'hourlyRate',
              type: 'number',
              min: 0,
              admin: {
                description: 'Session rate in USD per hour. Set 0 for free mentoring.',
                step: 1,
              },
            },
            {
              name: 'sessionDurations',
              type: 'select',
              hasMany: true,
              defaultValue: ['30', '60'],
              options: [
                { label: '30 minutes', value: '30' },
                { label: '45 minutes', value: '45' },
                { label: '60 minutes', value: '60' },
                { label: '90 minutes', value: '90' },
              ],
              admin: { description: 'Session lengths you are willing to offer.' },
            },
            {
              name: 'timezone',
              type: 'text',
              admin: {
                placeholder: 'e.g. America/New_York',
                description: 'IANA timezone string used for scheduling.',
              },
            },
            {
              name: 'availableDays',
              type: 'select',
              hasMany: true,
              options: [
                { label: 'Monday', value: 'mon' },
                { label: 'Tuesday', value: 'tue' },
                { label: 'Wednesday', value: 'wed' },
                { label: 'Thursday', value: 'thu' },
                { label: 'Friday', value: 'fri' },
                { label: 'Saturday', value: 'sat' },
                { label: 'Sunday', value: 'sun' },
              ],
              admin: { description: 'Days of the week when you typically take sessions.' },
            },
            {
              name: 'maxSessionsPerWeek',
              type: 'number',
              min: 1,
              max: 40,
              defaultValue: 5,
              admin: { description: 'Cap on weekly bookings to prevent overload.' },
            },
          ],
        },

        // ── Social Links ───────────────────────────────────────
        {
          label: 'Social & Links',
          fields: [
            {
              name: 'linkedin',
              type: 'text',
              admin: { placeholder: 'https://linkedin.com/in/yourhandle' },
            },
            {
              name: 'youtube',
              type: 'text',
              admin: { placeholder: 'https://youtube.com/@yourhandle' },
            },
            {
              name: 'instagram',
              type: 'text',
              admin: { placeholder: 'https://instagram.com/yourhandle' },
            },
            {
              name: 'website',
              type: 'text',
              admin: { placeholder: 'https://yourwebsite.com' },
            },
          ],
        },

        // ── Stats (admin-managed) ──────────────────────────────
        {
          label: 'Stats',
          fields: [
            {
              name: 'totalSessions',
              type: 'number',
              defaultValue: 0,
              min: 0,
              admin: {
                description: 'Incremented automatically when a session is marked complete.',
                readOnly: true,
              },
            },
            {
              name: 'totalEarningsUSD',
              type: 'number',
              defaultValue: 0,
              min: 0,
              admin: {
                description: 'Cumulative net earnings in USD after platform fees.',
                readOnly: true,
              },
            },
            {
              name: 'rating',
              type: 'number',
              min: 0,
              max: 5,
              defaultValue: 0,
              admin: {
                description: 'Average star rating (0–5). Recomputed on each new review.',
                readOnly: true,
                step: 0.1,
              },
            },
            {
              name: 'reviewCount',
              type: 'number',
              defaultValue: 0,
              min: 0,
              admin: {
                description: 'Total number of reviews received.',
                readOnly: true,
              },
            },
          ],
        },
      ],
    },
  ],
}
