// The endpoint name is request but for clarity, we use the term review.
import type { FromSchema } from 'json-schema-to-ts';

export const ZenodoReviewSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'ZenodoReview',
  type: 'object',
  properties: {
    id: { type: 'number' },
    created: { type: 'string', format: 'date-time' },
    updated: { type: 'string', format: 'date-time' },
    links: {
      type: 'object',
      properties: {
        actions: {
          type: 'object',
          properties: {
            accept: { type: 'string' },
            decline: { type: 'string' },
            cancel: { type: 'string' },
            submit: { type: 'string' }, // Only appears in the record/review endpoint but is not accessible (probably a bug)
          },
          additionalProperties: false,
        },
        self: { type: 'string' },
        self_html: { type: 'string' },
        comments: { type: 'string' },
        timeline: { type: 'string' },
      },
      required: ['self', 'self_html', 'comments', 'timeline'],
      additionalProperties: false,
    },
    revision_id: { type: 'number' },
    type: { type: 'string' },
    status: { type: 'string' },
    is_closed: { type: 'boolean' },
    is_open: { type: 'boolean' },
    expires_at: { type: 'string', format: 'date-time' },
    is_expired: { type: 'boolean' },
    created_by: {
      type: 'object',
      properties: {
        user: { type: 'string' },
      },
      required: ['user'],
      additionalProperties: false,
    },
    receiver: {
      type: 'object',
      properties: {
        community: { type: 'string' },
      },
      required: ['community'],
      additionalProperties: false,
    },
    topic: {
      type: 'object',
      properties: {
        record: { type: 'string' },
      },
      required: ['record'],
      additionalProperties: false,
    },
  },
  required: [
    'id',
    'created',
    'updated',
    'links',
    'revision_id',
    'type',
    'status',
    'is_closed',
    'is_open',
    'expires_at',
    'is_expired',
    'created_by',
    'receiver',
    'topic',
  ],
  additionalProperties: false,
} as const;

export type ZenodoReview = FromSchema<typeof ZenodoReviewSchema>;
