import type { FromSchema } from 'json-schema-to-ts';

import { zenodoMetadataSchema } from './ZenodoMetadataSchema.ts';

export const zenodoDepositionSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Deposition',
  type: 'object',
  properties: {
    created: {
      type: 'string',
      format: 'date-time',
      description: 'Creation time of deposition (ISO8601 format).',
    },
    modified: {
      type: 'string',
      format: 'date-time',
      description: 'Last modification time of deposition (ISO8601 format).',
    },
    doi: {
      type: 'string',
      description:
        'Digital Object Identifier (DOI). Present only for published depositions.',
    },
    doi_url: {
      type: 'string',
      format: 'uri',
      description:
        'Persistent link to your published deposition. Present only for published depositions.',
    },
    files: {
      type: 'array',
      description: 'A list of deposition files resources.',
      items: {
        type: 'object',
      },
    },
    id: {
      type: 'integer',
      description: 'Deposition identifier.',
    },
    metadata: zenodoMetadataSchema,

    owner: {
      type: 'integer',
      description: 'User identifier of the owner of the deposition.',
    },
    record_id: {
      type: 'integer',
      description: 'Record identifier. Present only for published depositions.',
    },
    record_url: {
      type: 'string',
      format: 'uri',
      description:
        'URL to public version of record for this deposition. Present only for published depositions.',
    },
    state: {
      type: 'string',
      enum: ['inprogress', 'done', 'error', 'unsubmitted'],
      description: 'State of deposition: inprogress, done, or error.',
    },
    submitted: {
      type: 'boolean',
      description:
        'True if the deposition has been published, False otherwise.',
    },
    title: {
      type: 'string',
      description:
        'Title of deposition (automatically set from metadata). Defaults to empty string.',
    },
    conceptrecid: {
      type: 'string',
      description: 'Concept record ID.',
    },
    links: {
      type: 'object',
      description: 'Links related to the deposition.',
      additionalProperties: { type: 'string' },
    },
    conceptdoi: {
      type: 'string',
      description: 'Concept DOI.',
    },
  },
  required: [],
  additionalProperties: false,
} as const;

export type ZenodoDeposition = FromSchema<typeof zenodoDepositionSchema>;
