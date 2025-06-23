import { test, expect } from 'vitest';

import type { ZenodoMetadata } from '../ZenodoMetadataSchema.ts';
import { validateZenodoMetadata } from '../schemaValidation.ts';

test('ZenodoMetadata as ts object (non typed)', () => {
  const validMetadata = {
    upload_type: 'dataset',
    publication_date: '2025-06-16',
    title: 'test dataset from npm library zenodo',
    creators: [{ name: 'test' }],
    description: 'test',
    access_right: 'open',
    license: 'CC0-1.0',
    imprint_publisher: 'Zenodo',
  };

  expect(() => validateZenodoMetadata(validMetadata)).not.toThrow();
});

test('ZenodoMetadata as type (typed using json-schema-to-ts)', () => {
  const metadata: ZenodoMetadata = {
    upload_type: 'dataset',
    publication_date: '2025-06-16',
    title: 'test dataset from npm library zenodo',
    creators: [{ name: 'test' }],
    description: 'test',
    access_right: 'open',
    license: 'CC0-1.0',
    imprint_publisher: 'Zenodo',
  };

  expect(() => validateZenodoMetadata(metadata)).not.toThrow();
});

test('ZenodoMetadata with additional field', () => {
  const invalidMetadata = {
    upload_type: 'dataset',
    publication_date: '2025-06-16',
    title: 'test dataset from npm library zenodo',
    creators: [{ name: 'test' }],
    description: 'test',
    access_right: 'open',
    license: 'CC0-1.0',
    publisher: 'Zenodo', // should be 'imprint_publisher'
  };

  expect(() => validateZenodoMetadata(invalidMetadata)).toThrow(
    'must NOT have additional properties',
  );
});
