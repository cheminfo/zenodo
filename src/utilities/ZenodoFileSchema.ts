import type { FromSchema } from 'json-schema-to-ts';

export const zenodoFileSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Zenodo File',
  type: 'object',
  properties: {
    created: {
      type: 'string',
      format: 'date-time',
    },
    updated: {
      type: 'string',
      format: 'date-time',
    },
    mimetype: {
      type: 'string',
    },
    version_id: {
      type: 'string',
    },
    file_id: {
      type: 'string',
    },
    bucket_id: {
      type: 'string',
    },
    metadata: {
      type: ['object', 'null'],
    },
    access: {
      type: 'object',
      properties: {
        hidden: {
          type: 'boolean',
        },
      },
      required: ['hidden'],
      additionalProperties: true,
    },
    links: {
      type: 'object',
      properties: {
        self: {
          type: 'string',
          format: 'uri',
        },
        content: {
          type: 'string',
          format: 'uri',
        },
        commit: {
          type: 'string',
          format: 'uri',
        },
      },
      required: ['self', 'content', 'commit'],
      additionalProperties: false,
    },
    key: {
      type: 'string',
    },
    transfer: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
        },
      },
      required: ['type'],
      additionalProperties: true,
    },
    status: {
      type: 'string',
    },
    checksum: {
      type: 'string',
    },
    size: {
      type: 'number',
    },
    storage_class: {
      type: 'string',
    },
  },
  required: [
    'created',
    'updated',
    'mimetype',
    'version_id',
    'file_id',
    'bucket_id',
    'access',
    'links',
    'key',
    'transfer',
    'status',
    'checksum',
    'size',
    'storage_class',
  ],
  additionalProperties: false,
} as const;

export type ZenodoFileType = FromSchema<typeof zenodoFileSchema>;
