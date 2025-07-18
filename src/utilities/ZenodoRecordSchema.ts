import type { FromSchema } from 'json-schema-to-ts';

import { zenodoDepositionSchema } from './ZenodoDepositionSchema.ts';

const modifiedDepositionSchema = {
  ...zenodoDepositionSchema,
  additionalProperties: true, // Change this to match the record schema
  properties: {
    ...zenodoDepositionSchema.properties,
    record_id: {
      type: 'integer',
      description: 'Record identifier. Present only for published depositions.',
    },
  },
} as const;

export const zenodoRecordSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'ZenodoRecord',
  allOf: [
    modifiedDepositionSchema,
    {
      type: 'object',
      required: [],
      properties: {
        recid: { type: 'string' },
        updated: { type: 'string', format: 'date-time' },
        revision: { type: 'number' },
        swh: {
          type: 'object',
          additionalProperties: true, // structure is not known
        },
        owners: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
            },
            required: ['id'],
            additionalProperties: false,
          },
        },
        status: { type: 'string' },
        stats: {
          type: 'object',
          properties: {
            downloads: { type: 'number' },
            unique_downloads: { type: 'number' },
            views: { type: 'number' },
            unique_views: { type: 'number' },
            version_downloads: { type: 'number' },
            version_unique_downloads: { type: 'number' },
            version_views: { type: 'number' },
            version_unique_views: { type: 'number' },
          },
          required: [
            'downloads',
            'unique_downloads',
            'views',
            'unique_views',
            'version_downloads',
            'version_unique_downloads',
            'version_views',
            'version_unique_views',
          ],
          additionalProperties: false,
        },
      },
      additionalProperties: true,
    },
  ],
} as const;

export type ZenodoRecord = FromSchema<typeof zenodoRecordSchema>;
