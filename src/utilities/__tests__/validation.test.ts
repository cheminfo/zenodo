/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect, describe } from 'vitest';

import type { ZenodoDeposition } from '../ZenodoDepositionSchema.ts';
import type { ZenodoFileType } from '../ZenodoFileSchema.ts';
import type { ZenodoMetadata } from '../ZenodoMetadataSchema.ts';
import type { ZenodoRecord } from '../ZenodoRecordSchema.ts';
import type { ZenodoReview } from '../ZenodoReviewSchema.ts';
import {
  validateZenodoMetadata,
  validateZenodoDeposition,
  validateZenodoRecord,
  validateZenodoFile,
  validateZenodoRequest,
  validateORCID,
} from '../schemaValidation.ts';

const createValidMetadata = (
  overrides: Partial<ZenodoMetadata> = {},
): ZenodoMetadata => ({
  upload_type: 'dataset',
  publication_date: '2025-06-16',
  title: 'Test Dataset',
  creators: [{ name: 'Test Author' }],
  description: 'Test description',
  access_right: 'open',
  license: 'cc-by-4.0',
  imprint_publisher: 'Zenodo',
  ...overrides,
});

const createValidDeposition = (
  overrides: Partial<ZenodoDeposition> = {},
): ZenodoDeposition => ({
  id: 123456,
  created: '2025-06-16T12:00:00Z',
  modified: '2025-06-16T12:00:00Z',
  metadata: createValidMetadata(),
  state: 'inprogress',
  submitted: false,
  title: 'Test Deposition',
  owner: 12345,
  ...overrides,
});

const createValidRecord = (
  overrides: Partial<ZenodoRecord> = {},
): ZenodoRecord => ({
  id: 123456,
  recid: '123456',
  created: '2025-06-16T12:00:00Z',
  updated: '2025-06-16T12:00:00Z',
  metadata: createValidMetadata(),
  links: {
    self: 'https://sandbox.zenodo.org/api/records/123456',
    html: 'https://sandbox.zenodo.org/records/123456',
  },
  revision: 1,
  owners: [{ id: '12345' }],
  status: 'published',
  stats: {
    downloads: 100,
    unique_downloads: 80,
    views: 200,
    unique_views: 150,
    version_downloads: 100,
    version_unique_downloads: 80,
    version_views: 200,
    version_unique_views: 150,
  },
  ...overrides,
});

const createValidFile = (
  overrides: Partial<ZenodoFileType> = {},
): ZenodoFileType => ({
  id: 'file-123',
  filename: 'test.csv',
  filesize: 1024,
  checksum: 'abc123',
  links: {
    self: 'https://sandbox.zenodo.org/api/files/file-123',
    download: 'https://sandbox.zenodo.org/api/files/file-123/test.csv',
  },
  ...overrides,
});

const createValidReview = (
  overrides: Partial<ZenodoReview> = {},
): ZenodoReview => ({
  id: 789,
  created: '2025-06-16T12:00:00Z',
  updated: '2025-06-16T12:00:00Z',
  links: {
    actions: {
      accept: 'https://sandbox.zenodo.org/api/requests/789/actions/accept',
      decline: 'https://sandbox.zenodo.org/api/requests/789/actions/decline',
      cancel: 'https://sandbox.zenodo.org/api/requests/789/actions/cancel',
    },
    self: 'https://sandbox.zenodo.org/api/requests/789',
    self_html: 'https://sandbox.zenodo.org/requests/789',
    comments: 'https://sandbox.zenodo.org/api/requests/789/comments',
    timeline: 'https://sandbox.zenodo.org/api/requests/789/timeline',
  },
  revision_id: 1,
  type: 'community-submission',
  status: 'submitted',
  is_closed: false,
  is_open: true,
  expires_at: '2025-07-16T12:00:00Z',
  is_expired: false,
  created_by: { user: 'user-123' },
  receiver: { community: 'community-456' },
  topic: { record: 'record-789' },
  ...overrides,
});

const createInvalidMetadata = (invalidField: string, invalidValue: any) => {
  const base = createValidMetadata();
  return { ...base, [invalidField]: invalidValue };
};

describe('ZenodoMetadata Validation', () => {
  test('validates correct metadata', () => {
    const metadata = createValidMetadata();
    expect(() => validateZenodoMetadata(metadata)).not.toThrow();
  });

  test('validates metadata with ORCID', () => {
    const metadata = createValidMetadata({
      creators: [
        {
          name: 'Test Author',
          orcid: '0000-0002-1825-0097',
          affiliation: 'Test University',
        },
      ],
    });
    expect(() => validateZenodoMetadata(metadata)).not.toThrow();
  });

  test('validates metadata with contributors', () => {
    const metadata = createValidMetadata({
      contributors: [
        {
          name: 'Test Contributor',
          type: 'DataCurator',
          orcid: '0000-0002-1825-0097',
        },
      ],
    });
    expect(() => validateZenodoMetadata(metadata)).not.toThrow();
  });

  test('validates embargoed access with required fields', () => {
    const metadata = createValidMetadata({
      access_right: 'embargoed',
      embargo_date: '2025-12-31',
    });
    expect(() => validateZenodoMetadata(metadata)).not.toThrow();
  });

  test.todo('rejects invalid license', () => {
    const metadata = createInvalidMetadata('license', 'invalid-license');
    expect(() => validateZenodoMetadata(metadata)).toThrow();
  });

  test('rejects invalid upload_type', () => {
    const metadata = createInvalidMetadata('upload_type', 'invalid-type');
    expect(() => validateZenodoMetadata(metadata)).toThrow();
  });

  test('rejects invalid access_right', () => {
    const metadata = createInvalidMetadata('access_right', 'invalid-access');
    expect(() => validateZenodoMetadata(metadata)).toThrow();
  });

  test('rejects invalid ORCID', () => {
    const metadata = createValidMetadata({
      creators: [{ name: 'Test Author', orcid: 'invalid-orcid' }],
    });
    expect(() => validateZenodoMetadata(metadata)).toThrow(
      /must match pattern/,
    );
  });

  test('rejects empty creators array', () => {
    const metadata = createValidMetadata({ creators: [] });
    expect(() => validateZenodoMetadata(metadata)).toThrow();
  });
});

describe('ZenodoDeposition Validation', () => {
  test('validates correct deposition', () => {
    const deposition = createValidDeposition();
    expect(() => validateZenodoDeposition(deposition)).not.toThrow();
  });

  test('validates deposition with all optional fields', () => {
    const deposition = createValidDeposition({
      doi: '10.5281/zenodo.123456',
      doi_url: 'https://doi.org/10.5281/zenodo.123456',
      record_id: 123456,
      record_url: 'https://zenodo.org/records/123456',
      conceptrecid: 'concept-123',
      conceptdoi: '10.5281/zenodo.123455',
      files: [{ id: 'file-1', filename: 'test.csv' }],
      links: { self: 'https://zenodo.org/api/depositions/123456' },
    });
    expect(() => validateZenodoDeposition(deposition)).not.toThrow();
  });

  test('rejects invalid state', () => {
    const deposition = createValidDeposition({ state: 'invalid-state' as any });
    expect(() => validateZenodoDeposition(deposition)).toThrow();
  });

  test.todo('rejects invalid metadata in deposition', () => {
    const deposition = createValidDeposition({
      metadata: createInvalidMetadata('license', 'invalid-license'),
    });
    expect(() => validateZenodoDeposition(deposition)).toThrow();
  });
});

describe('ZenodoRecord Validation', () => {
  test('validates correct record', () => {
    const record = createValidRecord();
    expect(() => validateZenodoRecord(record)).not.toThrow();
  });

  test('validates record with minimal required fields', () => {
    const record = createValidRecord({
      recid: undefined,
      revision: undefined,
      owners: undefined,
      status: undefined,
      stats: undefined,
    });
    expect(() => validateZenodoRecord(record)).not.toThrow();
  });

  test('validates record with SWH data', () => {
    const record = createValidRecord({
      swh: {
        archive: { swhid: 'swh:1:dir:abc123' },
        metadata: { original_url: 'https://example.com' },
      },
    });
    expect(() => validateZenodoRecord(record)).not.toThrow();
  });

  test('rejects invalid stats structure', () => {
    const record = createValidRecord({
      // @ts-expect-error stats is missing required fields
      stats: { downloads: 100 }, // Missing required fields
    });
    expect(() => validateZenodoRecord(record)).toThrow();
  });
});

describe('ZenodoFile Validation', () => {
  test('validates correct file', () => {
    const file = createValidFile();
    expect(() => validateZenodoFile(file)).not.toThrow();
  });

  test('validates file with all optional fields', () => {
    const file = createValidFile({
      id: 'file-123',
      filename: 'test.csv',
      filesize: 1024,
      checksum: 'abc123',
      links: {
        self: 'https://sandbox.zenodo.org/api/files/file-123',
        download: 'https://sandbox.zenodo.org/api/files/file-123/test.csv',
      },
    });
    expect(() => validateZenodoFile(file)).not.toThrow();
  });

  test('rejects file with invalid fields', () => {
    const file = createValidFile({ doesnotexist: -1024 } as any);
    expect(() => validateZenodoFile(file)).toThrow();
  });
});

describe('ZenodoReview Validation', () => {
  test('validates correct review', () => {
    const review = createValidReview();
    expect(() => validateZenodoRequest(review)).not.toThrow();
  });

  test('validates review with minimal actions', () => {
    const review = createValidReview({
      links: {
        ...createValidReview().links,
        actions: { accept: 'https://example.com/accept' },
      },
    });
    expect(() => validateZenodoRequest(review)).not.toThrow();
  });

  test('rejects review with missing required fields', () => {
    const review = createValidReview();
    delete (review as any).created_by;
    expect(() => validateZenodoRequest(review)).toThrow();
  });

  test('rejects review with invalid links structure', () => {
    const review = createValidReview({
      links: {
        self: 'https://example.com',
      } as any,
    });
    expect(() => validateZenodoRequest(review)).toThrow();
  });
});

describe('ORCID Validation', () => {
  test('validates correct ORCID', () => {
    expect(() => validateORCID('0000-0002-1825-0097')).not.toThrow();
    expect(validateORCID('0000-0002-1825-0097')).toBe('0000-0002-1825-0097');
  });

  test('validates ORCID without dashes', () => {
    expect(() => validateORCID('0000000218250097')).not.toThrow();
    expect(validateORCID('0000000218250097')).toBe('0000-0002-1825-0097');
  });

  test('validates ORCID with X check digit', () => {
    expect(() => validateORCID('0000-0002-1694-233X')).not.toThrow();
  });

  test('rejects invalid ORCID', () => {
    expect(() => validateORCID('invalid-orcid')).toThrow(/Invalid ORCID/);
  });

  test('rejects empty ORCID', () => {
    expect(() => validateORCID('')).toThrow(/ORCID is required/);
  });
});

describe('Edge Cases and Property-Based Testing', () => {
  const validLicenses = [
    'cc-by-4.0',
    'cc-by-sa-4.0',
    'cc-zero',
    'mit-license',
    'apache2.0',
    'gpl-3.0',
    'bsd-3-clause',
    'other-open',
  ];

  const validUploadTypes = [
    'dataset',
    'image',
    'lesson',
    'other',
    'physicalobject',
    'poster',
    'presentation',
    'publication',
    'software',
    'video',
  ];

  const validAccessRights = ['open', 'embargoed', 'restricted', 'closed'];

  test('validates metadata with all license types', () => {
    for (const license of validLicenses) {
      const metadata = createValidMetadata({ license });
      expect(() => validateZenodoMetadata(metadata)).not.toThrow();
    }
  });

  test('validates metadata with all upload types', () => {
    for (const upload_type of validUploadTypes) {
      // @ts-expect-error upload_type is a string literal type
      const metadata = createValidMetadata({ upload_type });
      expect(() => validateZenodoMetadata(metadata)).not.toThrow();
    }
  });

  test('validates metadata with all access rights', () => {
    for (const access_right of validAccessRights) {
      const metadata = createValidMetadata({
        // @ts-expect-error access_right is a string literal type
        access_right,
        ...(access_right === 'embargoed' ? { embargo_date: '2025-12-31' } : {}),
      });
      expect(() => validateZenodoMetadata(metadata)).not.toThrow();
    }
  });

  test('validates complex metadata with multiple optional fields', () => {
    const complexMetadata = createValidMetadata({
      keywords: ['test', 'dataset', 'science'],
      language: 'eng',
      notes: 'Additional notes about the dataset',
      references: ['https://example.com/ref1', 'https://example.com/ref2'],
      version: '1.0.0',
      communities: [{ identifier: 'community-1' }],
      grants: [{ id: '10.13039/501100000780::675191' }],
      related_identifiers: [
        {
          identifier: '10.5281/zenodo.123456',
          relation: 'cites',
          resource_type: 'dataset',
          scheme: 'doi',
        },
      ],
      contributors: [
        {
          name: 'Contributor Name',
          type: 'DataCurator',
          affiliation: 'Test University',
          orcid: '0000-0002-1825-0097',
        },
      ],
    });
    expect(() => validateZenodoMetadata(complexMetadata)).not.toThrow();
  });

  test('stress test with multiple random valid objects', () => {
    for (let i = 0; i < 10; i++) {
      const randomMetadata = createValidMetadata({
        title: `Random Dataset ${i}`,
        license:
          validLicenses[Math.floor(Math.random() * validLicenses.length)],
        // @ts-expect-error upload_type is a string literal type
        upload_type:
          validUploadTypes[Math.floor(Math.random() * validUploadTypes.length)],
        // @ts-expect-error access_right is a string literal type
        access_right:
          validAccessRights[
            Math.floor(Math.random() * validAccessRights.length)
          ],
        publication_date: `2025-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
      });

      if (randomMetadata.access_right === 'embargoed') {
        randomMetadata.embargo_date = '2025-12-31';
      }

      expect(() => validateZenodoMetadata(randomMetadata)).not.toThrow();
    }
  });
});

describe('Integration Tests', () => {
  test('validates complete workflow: metadata -> deposition -> record', () => {
    const metadata = createValidMetadata();
    const validatedMetadata = validateZenodoMetadata(metadata);

    const deposition = createValidDeposition({ metadata: validatedMetadata });
    const validatedDeposition = validateZenodoDeposition(deposition);

    const record = createValidRecord({
      metadata: validatedMetadata,
      id: validatedDeposition.id,
    });
    const validatedRecord = validateZenodoRecord(record);

    // @ts-expect-error metadata is unknown type
    expect(validatedRecord.metadata.title).toBe(metadata.title);
    expect(validatedRecord.id).toBe(deposition.id);
  });

  test('validates review workflow', () => {
    const record = createValidRecord();
    validateZenodoRecord(record);

    const review = createValidReview();
    const validatedReview = validateZenodoRequest(review);

    expect(validatedReview.is_open).toBe(true);
    expect(validatedReview.status).toBe('submitted');
  });
});
