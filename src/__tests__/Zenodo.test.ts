/* eslint-disable no-await-in-loop */
import { FifoLogger } from 'fifo-logger';
import { test, expect, afterEach } from 'vitest';

import { Zenodo } from '../Zenodo.ts';
import type { ZenodoMetadata } from '../records/RecordType.ts';

import { getConfig } from './getConfig.ts';

const config = getConfig();

const publicRecordId = '1078495'; // arbitrarily selected deposition: https://zenodo.org/records/1078495

afterEach(async () => {
  const zenodo = await Zenodo.create({
    host: 'sandbox.zenodo.org',
    accessToken: config.accessToken || '',
  });
  const records = await zenodo.listRecords();
  const existing = records.filter((d) => d.value.status !== 'published');
  for (const record of existing) {
    if (record.value.id !== undefined) {
      await zenodo.deleteRecord(record.value.id);
    }
  }
});

test('no token', async ({ expect }) => {
  // @ts-expect-error we are testing the error
  const zenodo = new Zenodo({
    host: 'zenodo.org',
  });
  const publicRecord = await zenodo.retrieveRecord(publicRecordId, {
    isPublished: true,
  });
  expect(publicRecord.value.id).toBe(publicRecordId);
});

test('create zenodo', async () => {
  const logger = new FifoLogger();
  const zenodo = await Zenodo.create({
    host: 'sandbox.zenodo.org',
    accessToken: config.accessToken || '',
    logger,
  });
  expect(zenodo).toBeInstanceOf(Zenodo);
  expect(zenodo.host).toBe('sandbox.zenodo.org');
  expect(zenodo.baseURL).toBe('https://sandbox.zenodo.org/api/');
  expect(zenodo.accessToken).toBe(config.accessToken);
});

test('create zenodo without token', async () => {
  const logger = new FifoLogger();
  await expect(
    Zenodo.create({
      host: 'sandbox.zenodo.org',
      accessToken: '',
      logger,
    }),
  ).rejects.toThrow(
    'Request failed, due to missing authorization (e.g. deleting an already submitted upload or missing scopes for your access token). Error response included.',
  );
});

test('authenticate', async () => {
  const logger = new FifoLogger();
  const zenodo = new Zenodo({
    host: 'sandbox.zenodo.org',
    accessToken: config.accessToken || '',
    logger,
  });

  const depositionMetadata: ZenodoMetadata = {
    resource_type: { id: 'dataset' },
    description: 'test retry logic',
    title: 'test createFiles retry logic',
    rights: [
      {
        id: 'cc-by-4.0',
      },
    ],
    creators: [
      {
        person_or_org: {
          name: 'test',
          family_name: 'test',
          given_name: 'retry',
          type: 'personal',
          identifiers: [{ identifier: 'retry-test', scheme: 'orcid' }],
        },
      },
    ],
  };

  const firstRecord = await zenodo.createRecord(depositionMetadata);
  const retrievedRecord = await zenodo.retrieveRecord(
    // @ts-expect-error value may be undefined
    firstRecord.value.id,
  );
  expect(retrievedRecord.value.id).toBe(firstRecord.value.id);
  // we could attach a file. We need a 'native' web file
  const firstFileData = new File(['Hello, world!'], 'example.txt', {
    type: 'text/plain',
  });
  const firstFile = await firstRecord.uploadFiles([firstFileData]);
  expect(firstFile[0]?.value.key).toBe('example.txt');

  const secondFileData = new File(['Hello, world 2!'], 'example2.txt', {
    type: 'text/plain',
  });
  const secondFile = await firstRecord.uploadFiles([secondFileData]);
  expect(secondFile[0]?.value.key).toBe('example2.txt');

  const thirdFileData = new File(['Hello, world 3!'], 'example3.txt', {
    type: 'text/plain',
  });
  const thirdFile = await firstRecord.uploadFiles([thirdFileData]);

  expect(thirdFile[0]?.value.key).toBe('example3.txt');

  const files = await firstRecord.listFiles();
  files.sort((a, b) => a.value.key.localeCompare(b.value.key));

  expect(files).toHaveLength(3);

  // @ts-expect-error value may be undefined
  await firstRecord.deleteFile(files[1]?.value.key);
  const filesAfterDelete = await firstRecord.listFiles();
  expect(filesAfterDelete).toHaveLength(2);

  // @ts-expect-error value may be undefined
  const retrievedFile = await firstRecord.retrieveFile(files[0]?.value.key);
  expect(retrievedFile.value.key).toBe('example.txt');

  const content = await retrievedFile
    .getContentResponse()
    .then((response) => response.text());

  expect(content).toContain('Hello, world!');

  const requests = await zenodo.retrieveRequests();
  expect(requests.hits.total).toBe(0);

  const logs = logger.getLogs();
  expect(logs.length).toBeGreaterThanOrEqual(7);
}, 15000);
