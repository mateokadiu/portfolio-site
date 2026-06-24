import { collection, config, fields, singleton } from '@keystatic/core';

export default config({
  storage: { kind: 'local' },
  ui: {
    brand: { name: 'mateo' },
    navigation: {
      'about me': ['personal', 'links'],
      content: ['skills', 'roles', 'education', 'certifications'],
    },
  },
  singletons: {
    personal: singleton({
      label: 'Personal',
      path: 'src/content/cv/personal',
      schema: {
        name: fields.text({ label: 'Full name' }),
        headline: fields.text({
          label: 'One-line headline',
          description: 'Shown big on the CV page',
        }),
        location: fields.text({ label: 'Location' }),
        timezone: fields.text({ label: 'Timezone (TZ id)', defaultValue: 'Europe/Tirane' }),
        tagline: fields.text({ label: 'Tagline', multiline: true }),
        bio: fields.text({ label: 'Bio (longer)', multiline: true }),
        openToWork: fields.checkbox({ label: 'Open to work', defaultValue: true }),
        availability: fields.text({
          label: 'Availability line',
          description: "e.g. 'open to senior IC roles, contract from Q3 2026'",
        }),
        email: fields.text({ label: 'Email' }),
        avatarUrl: fields.text({ label: 'Avatar URL', validation: { isRequired: false } }),
      },
    }),
    links: singleton({
      label: 'Social links',
      path: 'src/content/cv/links',
      schema: {
        github: fields.url({ label: 'GitHub' }),
        linkedin: fields.url({ label: 'LinkedIn' }),
        x: fields.url({ label: 'X / Twitter', validation: { isRequired: false } }),
        mastodon: fields.url({ label: 'Mastodon', validation: { isRequired: false } }),
        website: fields.url({ label: 'Website', validation: { isRequired: false } }),
      },
    }),
  },
  collections: {
    skills: collection({
      label: 'Skills',
      path: 'src/content/cv/skills/*',
      slugField: 'name',
      schema: {
        name: fields.slug({ name: { label: 'Skill name' } }),
        category: fields.select({
          label: 'Category',
          options: [
            { label: 'Languages', value: 'languages' },
            { label: 'Backend', value: 'backend' },
            { label: 'Frontend', value: 'frontend' },
            { label: 'Mobile', value: 'mobile' },
            { label: 'Infra / DevOps', value: 'infra' },
            { label: 'Data', value: 'data' },
            { label: 'Tools', value: 'tools' },
          ],
          defaultValue: 'backend',
        }),
        proficiency: fields.select({
          label: 'Proficiency',
          options: [
            { label: 'Expert', value: 'expert' },
            { label: 'Strong', value: 'strong' },
            { label: 'Working', value: 'working' },
            { label: 'Learning', value: 'learning' },
          ],
          defaultValue: 'strong',
        }),
        yearsUsing: fields.number({ label: 'Years using', defaultValue: 1 }),
        unlockedBy: fields.array(fields.text({ label: 'Prerequisite skill slug' }), {
          label: 'Prerequisite skills',
          description: 'Slugs of skills this one unlocks from (renders edges in the tree)',
        }),
        order: fields.number({
          label: 'Sort order',
          description: 'Lower numbers appear first in the category',
          defaultValue: 100,
        }),
      },
    }),
    roles: collection({
      label: 'Experience',
      path: 'src/content/cv/roles/*',
      slugField: 'slug',
      schema: {
        slug: fields.slug({ name: { label: 'Slug' } }),
        company: fields.text({ label: 'Company' }),
        title: fields.text({ label: 'Title' }),
        startDate: fields.date({ label: 'Start date' }),
        endDate: fields.date({ label: 'End date (blank = current)' }),
        location: fields.text({ label: 'Location' }),
        remote: fields.checkbox({ label: 'Remote', defaultValue: false }),
        summary: fields.text({ label: 'One-line summary', multiline: true }),
        bullets: fields.array(fields.text({ label: 'Bullet' }), {
          label: 'Achievements',
          itemLabel: (p) => p.value || 'bullet',
        }),
        stack: fields.array(fields.text({ label: 'Tech' }), {
          label: 'Stack chips',
          itemLabel: (p) => p.value || 'tech',
        }),
        accent: fields.select({
          label: 'Accent',
          options: [
            { label: 'Default (orange)', value: 'orange' },
            { label: 'Cyan', value: 'cyan' },
            { label: 'Lime', value: 'lime' },
          ],
          defaultValue: 'orange',
        }),
      },
    }),
    education: collection({
      label: 'Education',
      path: 'src/content/cv/education/*',
      slugField: 'slug',
      schema: {
        slug: fields.slug({ name: { label: 'Slug' } }),
        school: fields.text({ label: 'School' }),
        degree: fields.text({ label: 'Degree' }),
        startYear: fields.number({ label: 'Start year' }),
        endYear: fields.number({ label: 'End year' }),
        location: fields.text({ label: 'Location' }),
        notes: fields.text({ label: 'Notes', multiline: true }),
      },
    }),
    certifications: collection({
      label: 'Certifications',
      path: 'src/content/cv/certifications/*',
      slugField: 'slug',
      schema: {
        slug: fields.slug({ name: { label: 'Slug' } }),
        name: fields.text({ label: 'Name' }),
        issuer: fields.text({ label: 'Issuer' }),
        date: fields.date({ label: 'Date' }),
        credentialUrl: fields.url({ label: 'Credential URL', validation: { isRequired: false } }),
      },
    }),
  },
});
