/* eslint-disable no-await-in-loop */
import delay from 'delay';
import { FifoLogger } from 'fifo-logger';
import { test, expect, afterEach } from 'vitest';

import { Zenodo } from '../../Zenodo.ts';
import { getConfig } from '../../__tests__/getConfig.ts';
import type { ZenodoMetadata } from '../../utilities/ZenodoMetadataSchema.ts';

const config = getConfig();

afterEach(async () => {
  const zenodo = await Zenodo.create({
    host: 'sandbox.zenodo.org',
    accessToken: config.accessToken || '',
  });
  const records = await zenodo.listRecords();
  const existing = records.filter((d) => d.value.state !== 'done');
  for (const record of existing) {
    if (record.value.id !== undefined) {
      await zenodo.deleteRecord(record.value.id);
    }
  }
}, 50000);

test('createFiles with retry logic and failures', async () => {
  const logger = new FifoLogger();
  const zenodo = new Zenodo({
    host: 'sandbox.zenodo.org',
    accessToken: config.accessToken || '',
    logger,
  });

  const recordMetadata: ZenodoMetadata = {
    upload_type: 'dataset',
    description: 'test retry logic',
    access_right: 'open',
    title: 'test createFiles retry logic',
    license: 'cc-by-1.0',
    creators: [{ name: 'test' }],
  };

  const record = await zenodo.createRecord(recordMetadata);

  const file1 = new File(['test content 1'], 'test1.txt', {
    type: 'text/plain',
  });
  const file2 = new File(['test content 2'], 'test2.txt', {
    type: 'text/plain',
  });

  const results = await record.uploadFiles([file1, file2]);

  expect(results).toHaveLength(2);
  expect(results[0]?.value.key).toBe('test1.txt');

  const files = await record.listFiles();
  expect(files).toHaveLength(2);
});

test('retrieveFile method', async () => {
  const logger = new FifoLogger();
  const zenodo = new Zenodo({
    host: 'sandbox.zenodo.org',
    accessToken: config.accessToken || '',
    logger,
  });

  const recordMetadata: ZenodoMetadata = {
    upload_type: 'dataset',
    description: 'test retrieveFile',
    access_right: 'open',
    title: 'test retrieveFile method',
    license: 'cc-by-1.0',
    creators: [{ name: 'test' }],
  };

  const record = await zenodo.createRecord(recordMetadata);

  const fileData = new File(['Hello, World!'], 'example.txt', {
    type: 'text/plain',
  });
  const createdFile = await record.uploadFiles([fileData]);

  // @ts-expect-error createdFile may be undefined
  expect(createdFile[0].value).toBeDefined();
  // @ts-expect-error createdFile may be undefined
  expect(createdFile[0].value.key).toBe('example.txt');

  // @ts-expect-error createdFile may be undefined
  const retrievedFile = await record.retrieveFile(createdFile[0].value.key);
  expect(retrievedFile.value.key).toBe('example.txt');
}, 10000);

test('update record metadata', async () => {
  const logger = new FifoLogger();
  const zenodo = new Zenodo({
    host: 'sandbox.zenodo.org',
    accessToken: config.accessToken || '',
    logger,
  });

  const recordMetadata: ZenodoMetadata = {
    upload_type: 'dataset',
    description: 'original description',
    access_right: 'open',
    title: 'original title',
    license: 'cc-by-1.0',
    creators: [{ name: 'test' }],
  };

  const record = await zenodo.createRecord(recordMetadata);

  const updatedMetadata: ZenodoMetadata = {
    ...recordMetadata,
    description: 'updated description',
    title: 'updated title',
  };

  const updatedRecord = await record.update(updatedMetadata);

  expect(updatedRecord.value.metadata?.description).toBe('updated description');
  expect(updatedRecord.value.metadata?.title).toBe('updated title');
  expect(updatedRecord.value.id).toBe(record.value.id);
}, 10000);

test.todo('newVersion method', async () => {
  const logger = new FifoLogger();
  const zenodo = new Zenodo({
    host: 'sandbox.zenodo.org',
    accessToken: config.accessToken || '',
    logger,
  });

  const recordMetadata: ZenodoMetadata = {
    upload_type: 'dataset',
    description: 'test newVersion',
    access_right: 'open',
    title: 'test newVersion method',
    license: 'cc-by-1.0',
    creators: [{ name: 'test' }],
  };

  const record = await zenodo.createRecord(recordMetadata);

  const fileData = new File(['Hello, World!'], 'example.txt', {
    type: 'text/plain',
  });
  await record.uploadFiles([fileData]);

  const publishedRecord = await record.publish();
  expect(publishedRecord.value.state).toBe('done');

  const newVersion = await publishedRecord.newVersion();
  expect(newVersion.value.id).not.toBe(record.value.id);
  expect(newVersion.value.state).toBe('unsubmitted');

  expect(newVersion.value.metadata?.publication_date).toBeDefined();
  expect(newVersion.value.metadata?.publication_date).toMatch(
    /^\d{4}-\d{2}-\d{2}$/,
  );
});

test.todo('submitForReview without URL', async () => {
  const logger = new FifoLogger();
  const zenodo = new Zenodo({
    host: 'sandbox.zenodo.org',
    accessToken: config.accessToken || '',
    logger,
  });

  const recordMetadata: ZenodoMetadata = {
    upload_type: 'dataset',
    description: 'test submitForReview',
    access_right: 'open',
    title: 'test submitForReview method',
    license: 'cc-by-1.0',
    creators: [{ name: 'test' }],
  };

  const record = await zenodo.createRecord(recordMetadata);

  const fileData = new File(['Hello, World!'], 'example.txt', {
    type: 'text/plain',
  });
  await record.uploadFiles([fileData]);

  const review = await record.submitForReview();
  expect(review).toBeDefined();
  expect(review.topic.record).toBe(String(record.value.id));
});

test.todo('submitForReview with URL', async () => {
  const logger = new FifoLogger();
  const zenodo = new Zenodo({
    host: 'sandbox.zenodo.org',
    accessToken: config.accessToken || '',
    logger,
  });

  const recordMetadata: ZenodoMetadata = {
    upload_type: 'dataset',
    description: 'test submitForReview with URL',
    access_right: 'open',
    title: 'test submitForReview with URL method',
    license: 'cc-by-1.0',
    creators: [{ name: 'test' }],
  };

  const record = await zenodo.createRecord(recordMetadata);

  const fileData = new File(['Hello, World!'], 'example.txt', {
    type: 'text/plain',
  });
  await record.uploadFiles([fileData]);

  const reviewWithoutUrl = await record.submitForReview();

  const submitUrl = reviewWithoutUrl.links.actions?.submit;
  expect(submitUrl).toBeDefined();

  const reviewWithUrl = await record.submitForReview(submitUrl);
  expect(reviewWithUrl).toBeDefined();
});

test('deleteFile method', async () => {
  const logger = new FifoLogger();
  const zenodo = new Zenodo({
    host: 'sandbox.zenodo.org',
    accessToken: config.accessToken || '',
    logger,
  });

  const recordMetadata: ZenodoMetadata = {
    upload_type: 'dataset',
    description: 'test deleteFile',
    access_right: 'open',
    title: 'test deleteFile method',
    license: 'cc-by-1.0',
    creators: [{ name: 'test' }],
  };

  const record = await zenodo.createRecord(recordMetadata);

  const fileData = new File(['Hello, World!'], 'example.txt', {
    type: 'text/plain',
  });
  const createdFile = await record.uploadFiles([fileData]);

  // @ts-expect-error createdFile may be undefined
  expect(createdFile[0].value).toBeDefined();
  // @ts-expect-error createdFile may be undefined
  expect(createdFile[0].value.key).toBe('example.txt');

  let files = await record.listFiles();
  expect(files).toHaveLength(1);

  // @ts-expect-error createdFile may be undefined
  await record.deleteFile(createdFile[0].value.key);

  files = await record.listFiles();
  expect(files).toHaveLength(0);
}, 10000);

test('createFilesAsZip method', async () => {
  const logger = new FifoLogger();
  const zenodo = new Zenodo({
    host: 'sandbox.zenodo.org',
    accessToken: config.accessToken || '',
    logger,
  });

  const recordMetadata: ZenodoMetadata = {
    upload_type: 'dataset',
    description: 'test createFilesAsZip',
    access_right: 'open',
    title: 'test createFilesAsZip method',
    license: 'cc-by-1.0',
    creators: [{ name: 'test' }],
  };

  const record = await zenodo.createRecord(recordMetadata);

  const file1 = new File(['content 1'], 'file1.txt', { type: 'text/plain' });
  const file2 = new File(['content 2'], 'file2.txt', { type: 'text/plain' });

  const results = await record.uploadFilesAsZip(
    [file1, file2],
    'custom-archive',
  );

  expect(results).toHaveLength(1);
  expect(results[0]?.value.key).toBe('custom-archive.zip');

  const files = await record.listFiles();
  expect(files).toHaveLength(1);
  expect(files[0]?.value.key).toBe('custom-archive.zip');
});

test('basic record manipulations', async () => {
  const logger = new FifoLogger();
  const zenodo = new Zenodo({
    host: 'sandbox.zenodo.org',
    accessToken: config.accessToken || '',
    logger,
  });

  const recordMetadata: ZenodoMetadata = {
    upload_type: 'dataset',
    description: 'test basic record manipulations',
    access_right: 'open',
    title: 'test basic manipulations from npm library zenodo',
    license: 'cc-by-1.0',
    creators: [
      {
        name: 'test',
      },
    ],
  };

  const record = await zenodo.createRecord(recordMetadata);
  const firstFileData = new File(['Hello, damned world!'], 'example.txt', {
    type: 'text/plain',
  });
  await record.uploadFiles([firstFileData]);
  await delay(1000);

  const secondFileData = new File(['Goodbye, world!'], 'example2.txt', {
    type: 'text/plain',
  });
  const thirdFileData = new File(['Hello, world 3!'], 'example3.txt', {
    type: 'text/plain',
  });
  await record.uploadFiles([secondFileData, thirdFileData]);

  const fourthFileData = new File(['Hello, world 4!'], 'example4.txt', {
    type: 'text/plain',
  });
  await record.uploadFilesAsZip([fourthFileData], 'example4');

  const files = await record.listFiles();
  expect(files.length).toBe(4);
  await record.deleteAllFiles();
  const emptyFiles = await record.listFiles();
  expect(emptyFiles.length).toBe(0);

  if (typeof record.value.id === 'number') {
    await zenodo.deleteRecord(record.value.id);
  } else {
    throw new Error('Record ID is undefined');
  }

  const logs = logger.getLogs();
  expect(logs.length).toBeGreaterThanOrEqual(10);
}, 10000);

test('add to community', async () => {
  const logger = new FifoLogger();
  const zenodo = new Zenodo({
    host: 'sandbox.zenodo.org',
    accessToken: config.accessToken || '',
    logger,
  });
  const recordMetadata: ZenodoMetadata = {
    upload_type: 'dataset',
    description: 'test',
    access_right: 'open',
    title: 'test community',
    creators: [
      {
        name: 'test',
      },
    ],
    license: 'cc-by-1.0',
  };
  const record = await zenodo.createRecord(recordMetadata);
  const firstFileData = new File(['Hello, World!'], 'example.txt', {
    type: 'text/plain',
  });
  await record.uploadFiles([firstFileData]);
  expect(record.value.id).toBeDefined();
  const communityId = '24dd3aa0-38b4-415d-b038-cf71aa67e187';
  const request = await record.addToCommunity(communityId);
  expect(request).toBeDefined();
  expect(request).toHaveProperty('links.actions');
  // @ts-expect-error request is unknown type
  expect(request.receiver.community).toBe(communityId);
  // @ts-expect-error request is unknown type
  expect(request.topic.record).toBeDefined();
  // @ts-expect-error request is unknown type
  expect(request.topic.record).toEqual(String(record.value.id));
});

test.todo('publish record', async () => {
  const logger = new FifoLogger();
  const zenodo = new Zenodo({
    host: 'sandbox.zenodo.org',
    accessToken: config.accessToken || '',
    logger,
  });

  const recordMetadata: ZenodoMetadata = {
    upload_type: 'dataset',
    description: 'test',
    access_right: 'open',
    title: 'test publish from npm library zenodo',
    creators: [
      {
        name: 'test',
      },
    ],
  };

  const record = await zenodo.createRecord(recordMetadata);
  expect(record.value.id).toBeDefined();

  const publishedRecord = await record.publish();
  expect(publishedRecord.value.id).toBe(record.value.id);
  expect(publishedRecord.value.state).toBe('done');
  expect(publishedRecord.value.submitted).toBe(true);

  const newVersion = await publishedRecord.newVersion();
  expect(newVersion.value.id).not.toBe(record.value.id);
  expect(newVersion.value.state).toBe('unsubmitted');

  // @ts-expect-error newVersion is unknown type
  const versions = await zenodo.retrieveVersions(newVersion.value.id);
  expect(versions.length).toBeGreaterThan(0);
  const latestVersion = versions.find(
    // @ts-expect-error version is unknown type
    (version) => version.metadata.relations.version[0].is_last === true,
  );

  expect(latestVersion).toBeDefined();
});

test.todo('submit for review', async () => {
  const logger = new FifoLogger();
  const zenodo = new Zenodo({
    host: 'sandbox.zenodo.org',
    accessToken: config.accessToken || '',
    logger,
  });

  const recordMetadata: ZenodoMetadata = {
    upload_type: 'dataset',
    description: 'test',
    access_right: 'open',
    title: 'test submit for review from npm library zenodo',
    creators: [
      {
        name: 'test',
      },
    ],
  };

  const record = await zenodo.createRecord(recordMetadata);
  expect(record.value.id).toBeDefined();

  await record.submitForReview();
  await zenodo.retrieveRequests();
});
