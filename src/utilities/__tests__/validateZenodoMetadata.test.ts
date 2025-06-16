import { test, expect } from 'vitest';

import type { ZenodoMetadata } from '../schema';
import { validateZenodoMetadata } from '../validateZenodoMetadata';

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

  const invalidMetadata = {
    upload_type: 'dataset',
    publication_date: '2025-06-16',
    title: 'test dataset from npm library zenodo',
    creators: [{ name: 'test', affiliation: null }], // affiliation should be a string or field should be removed
    description: 'test',
    access_right: 'open',
    license: 'cc-zero', // this license is not in the enum from the schema
    prereserve_doi: { doi: '10.5281/zenodo.271104', recid: 271104 }, // prereserve_doi doesn't exist in the schema
    imprint_publisher: 'Zenodo',
  };

  expect(() => validateZenodoMetadata(invalidMetadata)).toThrow(
    'Zenodo metadata validation failed:',
  );
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
