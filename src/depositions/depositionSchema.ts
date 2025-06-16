import { z } from 'zod';

import { zenodoFileSchema } from '../ZenodoFile';

const creatorSchema = z.object({
  name: z.string(),
  affiliation: z.union([z.string().optional(), z.null()]),
  orcid: z.string().optional(),
  gnd: z.string().optional(),
});

const relatedIdentifierSchema = z.object({
  identifier: z.string(),
  relation: z.string(),
  resource_type: z.string().optional(),
});

const contributorSchema = z.object({
  name: z.string(),
  type: z.string(),
  affiliation: z.string().optional(),
  orcid: z.string().optional(),
  gnd: z.string().optional(),
});

const communitySchema = z.object({
  identifier: z.string(),
});

const grantSchema = z.object({
  id: z.string(),
});

const subjectSchema = z.object({
  term: z.string(),
  identifier: z.string(),
  scheme: z.string(),
});

const locationSchema = z.object({
  lat: z.number().optional(),
  lon: z.number().optional(),
  place: z.string(),
  description: z.string().optional(),
});

const dateIntervalSchema = z.object({
  start: z.string().optional(),
  end: z.string().optional(),
  type: z.string(),
  description: z.string().optional(),
});

// API returns microseconds in timestamps that is not supported for ISO 8601 default validation
const iso8601WithMicroseconds = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: 'Invalid datetime format',
  });

const linksSchema = z
  .object({
    self: z.string().url(),
    html: z.string().url(),
    badge: z.string().url(),
    files: z.string().url(),
    latest_draft: z.string().url(),
    latest_draft_html: z.string().url(),
    publish: z.string().url(),
    edit: z.string().url(),
    discard: z.string().url(),
    newversion: z.string().url(),
  })
  .catchall(z.string().url()); // Allows extra keys with URL values

export const depositionMetadataSchema = z.object({
  upload_type: z.enum([
    'publication',
    'poster',
    'presentation',
    'dataset',
    'image',
    'video',
    'software',
    'lesson',
    'physicalobject',
    'other',
  ]),
  publication_type: z.string().optional(),
  image_type: z.string().optional(),
  publication_date: z.string().optional(),
  title: z.string(),
  creators: z.array(creatorSchema),
  description: z.string(),
  access_right: z.enum(['open', 'embargoed', 'restricted', 'closed']),
  license: z.string().optional(),
  embargo_date: z.string().optional(),
  access_conditions: z.string().optional(),
  doi: z.string().optional(),
  prereserve_doi: z.union([z.boolean(), z.record(z.unknown())]).optional(),
  keywords: z.array(z.string()).optional(),
  notes: z.string().optional(),
  related_identifiers: z.array(relatedIdentifierSchema).optional(),
  contributors: z.array(contributorSchema).optional(),
  references: z.array(z.string()).optional(),
  communities: z.array(communitySchema).optional(),
  grants: z.array(grantSchema).optional(),
  journal_title: z.string().optional(),
  journal_volume: z.string().optional(),
  journal_issue: z.string().optional(),
  journal_pages: z.string().optional(),
  conference_title: z.string().optional(),
  conference_acronym: z.string().optional(),
  conference_dates: z.string().optional(),
  conference_place: z.string().optional(),
  conference_url: z.string().optional(),
  conference_session: z.string().optional(),
  conference_session_part: z.string().optional(),
  imprint_publisher: z.string().optional(),
  imprint_isbn: z.string().optional(),
  imprint_place: z.string().optional(),
  partof_title: z.string().optional(),
  partof_pages: z.string().optional(),
  thesis_supervisors: z.array(creatorSchema).optional(),
  thesis_university: z.string().optional(),
  subjects: z.array(subjectSchema).optional(),
  version: z.string().optional(),
  language: z.string().optional(),
  locations: z.array(locationSchema).optional(),
  dates: z.array(dateIntervalSchema).optional(),
  method: z.string().optional(),
});

export type DepositionMetadata = z.infer<typeof depositionMetadataSchema>;

export const zenodoDepositionSchema = z.object({
  created: iso8601WithMicroseconds, // ISO8601 timestamp
  modified: iso8601WithMicroseconds, // ISO8601 timestamp
  id: z.number(),
  metadata: depositionMetadataSchema,
  title: z.string(),
  doi: z.string().optional(), // Present only for published depositions
  doi_url: z.string().url().optional(), // URL to DOI
  record_url: z.string().url().optional(), // URL to public version of record
  links: linksSchema,
  record_id: z.number().optional(), // Present only for published depositions
  owner: z.number(),
  files: z.array(zenodoFileSchema),
  state: z.enum(['unsubmitted', 'inprogress', 'done', 'error']),
  submitted: z.boolean(),
});

export type ZenodoDeposition = z.infer<typeof zenodoDepositionSchema>;
