import type { FromSchema } from 'json-schema-to-ts';

export const zenodoFileSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Zenodo File',
  type: 'object',
  properties: {
    id: {
      type: 'string',
    },
    filename: {
      type: 'string',
    },
    filesize: {
      type: 'number',
    },
    checksum: {
      type: 'string',
    },
    links: {
      type: 'object',
      properties: {
        download: {
          type: 'string',
          format: 'uri',
        },
        self: {
          type: 'string',
          format: 'uri',
        },
      },
      required: ['download', 'self'],
      additionalProperties: false,
    },
  },
  required: ['id', 'filename', 'filesize', 'checksum', 'links'],
  additionalProperties: false,
} as const;

export type ZenodoFileType = FromSchema<typeof zenodoFileSchema>;
