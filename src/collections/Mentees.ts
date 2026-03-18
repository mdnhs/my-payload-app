import type { CollectionConfig } from 'payload'

const isAdmin = ({ req }: { req: { user?: { role?: string } | null } }) =>
  req.user?.role === 'admin'

export const Mentees: CollectionConfig = {
  slug: 'mentees',
  admin: {
    useAsTitle: 'targetCountry',
    description: 'Student profiles — people who want to study abroad, linked via the user relationship.',
    group: 'Profiles',
    defaultColumns: ['user', 'targetCountry', 'targetDegree', 'fieldOfInterest', 'totalSessions'],
  },
  access: {
    read: ({ req }) => isAdmin({ req }) || Boolean(req.user),
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
        description: 'The user account that owns this student profile.',
        position: 'sidebar',
      },
    },
    {
      name: 'profileImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        position: 'sidebar',
        description: 'Profile photo.',
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
              name: 'bio',
              type: 'textarea',
              maxLength: 800,
              admin: {
                description: 'Short bio — tell mentors about yourself and your study abroad plans.',
                rows: 4,
              },
            },
            {
              name: 'currentEducation',
              type: 'select',
              required: true,
              defaultValue: 'bachelor',
              options: [
                { label: 'High School / HSC', value: 'high_school' },
                { label: "Bachelor's (ongoing/completed)", value: 'bachelor' },
                { label: "Master's (ongoing/completed)", value: 'master' },
                { label: 'Working Professional', value: 'working' },
              ],
              admin: { description: 'Your current education level.' },
            },
            {
              name: 'targetDegree',
              type: 'select',
              required: true,
              defaultValue: 'master',
              options: [
                { label: "Bachelor's", value: 'bachelor' },
                { label: "Master's", value: 'master' },
                { label: 'PhD', value: 'phd' },
                { label: 'Language Course', value: 'language' },
                { label: 'Foundation / Pathway', value: 'foundation' },
                { label: 'Diploma / Certificate', value: 'diploma' },
              ],
              admin: { description: 'The degree level you want to pursue abroad.' },
            },
            {
              name: 'fieldOfInterest',
              type: 'text',
              admin: {
                placeholder: 'e.g. Computer Science, Business, Medicine',
                description: 'The field or subject you want to study.',
              },
            },
            {
              name: 'targetCountry',
              type: 'select',
              hasMany: true,
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
              admin: { description: 'Countries you are considering for study abroad.' },
            },
            {
              name: 'targetIntake',
              type: 'text',
              admin: {
                placeholder: 'e.g. Fall 2026, Spring 2027',
                description: 'When do you plan to start studying abroad?',
              },
            },
            {
              name: 'englishProficiency',
              type: 'select',
              options: [
                { label: 'Native Speaker', value: 'native' },
                { label: 'Advanced / Fluent', value: 'advanced' },
                { label: 'Intermediate', value: 'intermediate' },
                { label: 'Basic', value: 'basic' },
                { label: 'Preparing for IELTS', value: 'preparing_ielts' },
                { label: 'Preparing for TOEFL', value: 'preparing_toefl' },
                { label: 'IELTS Score Available', value: 'has_ielts' },
                { label: 'TOEFL Score Available', value: 'has_toefl' },
              ],
              admin: { description: 'Your English language proficiency.' },
            },
            {
              name: 'budgetRange',
              type: 'select',
              options: [
                { label: 'Need Full Scholarship', value: 'full_scholarship' },
                { label: 'Under $10,000/year', value: 'under_10k' },
                { label: '$10,000–$25,000/year', value: '10k_25k' },
                { label: '$25,000–$50,000/year', value: '25k_50k' },
                { label: 'Over $50,000/year', value: 'over_50k' },
                { label: 'Flexible', value: 'flexible' },
              ],
              admin: { description: 'Annual tuition budget range.' },
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
                  admin: { placeholder: 'e.g. English, Bengali' },
                },
              ],
            },
          ],
        },

        // ── Goals ─────────────────────────────────────────────
        {
          label: 'Goals & Preferences',
          fields: [
            {
              name: 'helpNeeded',
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
                { label: 'Language Test Prep', value: 'language_test' },
              ],
              admin: { description: 'What kind of help are you looking for?' },
            },
            {
              name: 'goals',
              type: 'array',
              maxRows: 10,
              admin: { description: 'Specific goals you want to achieve.' },
              fields: [
                {
                  name: 'goal',
                  type: 'text',
                  required: true,
                  admin: { placeholder: 'e.g. Get admitted to a top-50 university in Canada' },
                },
                {
                  name: 'targetDate',
                  type: 'date',
                  admin: { description: 'Optional target completion date.' },
                },
                {
                  name: 'completed',
                  type: 'checkbox',
                  defaultValue: false,
                },
              ],
            },
            {
              name: 'timezone',
              type: 'text',
              admin: {
                placeholder: 'e.g. Asia/Dhaka',
                description: 'IANA timezone string used for scheduling.',
              },
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
              name: 'facebook',
              type: 'text',
              admin: { placeholder: 'https://facebook.com/yourhandle' },
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
              name: 'totalHoursLearned',
              type: 'number',
              defaultValue: 0,
              min: 0,
              admin: {
                description: 'Total hours spent in completed sessions.',
                readOnly: true,
              },
            },
          ],
        },
      ],
    },
  ],
}
