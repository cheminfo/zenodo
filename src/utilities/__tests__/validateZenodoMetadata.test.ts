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
    license: 'cc-by-1.0',
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
    license: 'cc-by-1.0',
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
    license: 'cc-by-1.0',
    publisher: 'Zenodo', // should be 'imprint_publisher'
  };

  expect(() => validateZenodoMetadata(invalidMetadata)).toThrow(
    'must NOT have additional properties',
  );
});

test('ZenodoMetadata with missing required field', () => {
  const invalidMetadata = {
    title: 'Test visualizer',
    description: '<p><span class="ql-cursor">﻿</span>Test visualizer</p>',
    creators: [
      {
        name: 'Test, visualizer',
        affiliation: 'Swiss Federal Institute of Technology in Lausanne',
        orcid: '0000-0000-0000-0000',
      },
    ],
    license: 'cc-pddc',
    imprint_publisher: 'Test visualizer',
    access_right: 'open',
    publication_date: '2025-06-27',
    upload_type: 'dataset',
  };

  expect(() => validateZenodoMetadata(invalidMetadata)).not.toThrow();
});
