/* eslint-disable no-await-in-loop */
import delay from 'delay';
import { FifoLogger } from 'fifo-logger';
import { test, expect, afterEach, vi } from 'vitest';

import { Zenodo } from '../../Zenodo.ts';
import { getConfig } from '../../__tests__/getConfig.ts';
import type { ZenodoMetadata } from '../../utilities/ZenodoMetadataSchema.ts';

const config = getConfig();

afterEach(async () => {
  const zenodo = await Zenodo.create({
    host: 'sandbox.zenodo.org',
    accessToken: config.accessToken || '',
  });
  const depositions = await zenodo.listDepositions();
  const existing = depositions.filter((d) => d.value.state !== 'done');
  for (const deposition of existing) {
    if (deposition.value.id !== undefined) {
      await zenodo.deleteDeposition(deposition.value.id);
    }
  }
});

test('createFiles with retry logic and failures', async () => {
  const logger = new FifoLogger();
  const zenodo = new Zenodo({
    host: 'sandbox.zenodo.org',
    accessToken: config.accessToken || '',
    logger,
  });

  const depositionMetadata: ZenodoMetadata = {
    upload_type: 'dataset',
    description: 'test retry logic',
    access_right: 'open',
    title: 'test createFiles retry logic',
    license: 'cc-by-1.0',
    creators: [{ name: 'test' }],
  };

  const deposition = await zenodo.createDeposition(depositionMetadata);

  const file1 = new File(['test content 1'], 'test1.txt', {
    type: 'text/plain',
  });
  const file2 = new File(['test content 2'], 'test2.txt', {
    type: 'text/plain',
  });

  const results = await deposition.createFiles([file1, file2]);

  expect(results).toHaveLength(2);
  expect(results[0]?.value.filename).toBe('test1.txt');

  const files = await deposition.listFiles();
  expect(files).toHaveLength(2);
});

test('createFile error handling', async () => {
  const logger = new FifoLogger();
  const zenodo = new Zenodo({
    host: 'sandbox.zenodo.org',
    accessToken: config.accessToken || '',
    logger,
  });

  const depositionMetadata: ZenodoMetadata = {
    upload_type: 'dataset',
    description: 'test error handling',
    access_right: 'open',
    title: 'test createFile error handling',
    license: 'cc-by-1.0',
    creators: [{ name: 'test' }],
  };

  const deposition = await zenodo.createDeposition(depositionMetadata);

  const originalCreateFiles = deposition.createFiles.bind(deposition);
  deposition.createFiles = vi.fn().mockResolvedValue([]);

  const file = new File(['test'], 'test.txt', { type: 'text/plain' });

  await expect(deposition.createFile(file)).rejects.toThrow(
    'Failed to create file: No status object returned.',
  );

  deposition.createFiles = originalCreateFiles;
});

test('retrieveFile method', async () => {
  const logger = new FifoLogger();
  const zenodo = new Zenodo({
    host: 'sandbox.zenodo.org',
    accessToken: config.accessToken || '',
    logger,
  });

  const depositionMetadata: ZenodoMetadata = {
    upload_type: 'dataset',
    description: 'test retrieveFile',
    access_right: 'open',
    title: 'test retrieveFile method',
    license: 'cc-by-1.0',
    creators: [{ name: 'test' }],
  };

  const deposition = await zenodo.createDeposition(depositionMetadata);

  const fileData = new File(['Hello, World!'], 'example.txt', {
    type: 'text/plain',
  });
  const createdFile = await deposition.createFile(fileData);

  expect(createdFile.value).toBeDefined();
  expect(createdFile.value.filename).toBe('example.txt');

  const retrievedFile = await deposition.retrieveFile(createdFile.value.id);
  expect(retrievedFile.value.filename).toBe('example.txt');
  expect(retrievedFile.value.id).toBe(createdFile.value.id);
});

test('update deposition metadata', async () => {
  const logger = new FifoLogger();
  const zenodo = new Zenodo({
    host: 'sandbox.zenodo.org',
    accessToken: config.accessToken || '',
    logger,
  });

  const depositionMetadata: ZenodoMetadata = {
    upload_type: 'dataset',
    description: 'original description',
    access_right: 'open',
    title: 'original title',
    license: 'cc-by-1.0',
    creators: [{ name: 'test' }],
  };

  const deposition = await zenodo.createDeposition(depositionMetadata);

  const updatedMetadata: ZenodoMetadata = {
    ...depositionMetadata,
    description: 'updated description',
    title: 'updated title',
  };

  const updatedDeposition = await deposition.update(updatedMetadata);

  expect(updatedDeposition.value.metadata?.description).toBe(
    'updated description',
  );
  expect(updatedDeposition.value.metadata?.title).toBe('updated title');
  expect(updatedDeposition.value.id).toBe(deposition.value.id);
});

test.todo('newVersion method', async () => {
  const logger = new FifoLogger();
  const zenodo = new Zenodo({
    host: 'sandbox.zenodo.org',
    accessToken: config.accessToken || '',
    logger,
  });

  const depositionMetadata: ZenodoMetadata = {
    upload_type: 'dataset',
    description: 'test newVersion',
    access_right: 'open',
    title: 'test newVersion method',
    license: 'cc-by-1.0',
    creators: [{ name: 'test' }],
  };

  const deposition = await zenodo.createDeposition(depositionMetadata);

  const fileData = new File(['Hello, World!'], 'example.txt', {
    type: 'text/plain',
  });
  await deposition.createFile(fileData);

  const publishedDeposition = await deposition.publish();
  expect(publishedDeposition.value.state).toBe('done');

  const newVersion = await publishedDeposition.newVersion();
  expect(newVersion.value.id).not.toBe(deposition.value.id);
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

  const depositionMetadata: ZenodoMetadata = {
    upload_type: 'dataset',
    description: 'test submitForReview',
    access_right: 'open',
    title: 'test submitForReview method',
    license: 'cc-by-1.0',
    creators: [{ name: 'test' }],
  };

  const deposition = await zenodo.createDeposition(depositionMetadata);

  const fileData = new File(['Hello, World!'], 'example.txt', {
    type: 'text/plain',
  });
  await deposition.createFile(fileData);

  const review = await deposition.submitForReview();
  expect(review).toBeDefined();
  expect(review.topic.record).toBe(String(deposition.value.id));
});

test.todo('submitForReview with URL', async () => {
  const logger = new FifoLogger();
  const zenodo = new Zenodo({
    host: 'sandbox.zenodo.org',
    accessToken: config.accessToken || '',
    logger,
  });

  const depositionMetadata: ZenodoMetadata = {
    upload_type: 'dataset',
    description: 'test submitForReview with URL',
    access_right: 'open',
    title: 'test submitForReview with URL method',
    license: 'cc-by-1.0',
    creators: [{ name: 'test' }],
  };

  const deposition = await zenodo.createDeposition(depositionMetadata);

  const fileData = new File(['Hello, World!'], 'example.txt', {
    type: 'text/plain',
  });
  await deposition.createFile(fileData);

  const reviewWithoutUrl = await deposition.submitForReview();

  const submitUrl = reviewWithoutUrl.links.actions?.submit;
  expect(submitUrl).toBeDefined();

  const reviewWithUrl = await deposition.submitForReview(submitUrl);
  expect(reviewWithUrl).toBeDefined();
});

test('deleteFile method', async () => {
  const logger = new FifoLogger();
  const zenodo = new Zenodo({
    host: 'sandbox.zenodo.org',
    accessToken: config.accessToken || '',
    logger,
  });

  const depositionMetadata: ZenodoMetadata = {
    upload_type: 'dataset',
    description: 'test deleteFile',
    access_right: 'open',
    title: 'test deleteFile method',
    license: 'cc-by-1.0',
    creators: [{ name: 'test' }],
  };

  const deposition = await zenodo.createDeposition(depositionMetadata);

  const fileData = new File(['Hello, World!'], 'example.txt', {
    type: 'text/plain',
  });
  const createdFile = await deposition.createFile(fileData);

  expect(createdFile.value).toBeDefined();
  expect(createdFile.value.filename).toBe('example.txt');

  let files = await deposition.listFiles();
  expect(files).toHaveLength(1);

  await deposition.deleteFile(createdFile.value.id);

  files = await deposition.listFiles();
  expect(files).toHaveLength(0);
});

test('createFilesAsZip method', async () => {
  const logger = new FifoLogger();
  const zenodo = new Zenodo({
    host: 'sandbox.zenodo.org',
    accessToken: config.accessToken || '',
    logger,
  });

  const depositionMetadata: ZenodoMetadata = {
    upload_type: 'dataset',
    description: 'test createFilesAsZip',
    access_right: 'open',
    title: 'test createFilesAsZip method',
    license: 'cc-by-1.0',
    creators: [{ name: 'test' }],
  };

  const deposition = await zenodo.createDeposition(depositionMetadata);

  const file1 = new File(['content 1'], 'file1.txt', { type: 'text/plain' });
  const file2 = new File(['content 2'], 'file2.txt', { type: 'text/plain' });

  const results = await deposition.createFilesAsZip(
    [file1, file2],
    'custom-archive',
  );

  expect(results).toHaveLength(1);
  expect(results[0]?.value.filename).toBe('custom-archive.zip');

  const files = await deposition.listFiles();
  expect(files).toHaveLength(1);
  expect(files[0]?.value.filename).toBe('custom-archive.zip');
});

test('basic deposition manipulations', async () => {
  const logger = new FifoLogger();
  const zenodo = new Zenodo({
    host: 'sandbox.zenodo.org',
    accessToken: config.accessToken || '',
    logger,
  });

  const depositionMetadata: ZenodoMetadata = {
    upload_type: 'dataset',
    description: 'test basic deposition manipulations',
    access_right: 'open',
    title: 'test basic manipulations from npm library zenodo',
    license: 'cc-by-1.0',
    creators: [
      {
        name: 'test',
      },
    ],
  };

  const deposition = await zenodo.createDeposition(depositionMetadata);
  const firstFileData = new File(['Hello, damned world!'], 'example.txt', {
    type: 'text/plain',
  });
  await deposition.createFile(firstFileData);
  await delay(1000);

  const secondFileData = new File(['Goodbye, world!'], 'example2.txt', {
    type: 'text/plain',
  });
  const thirdFileData = new File(['Hello, world 3!'], 'example3.txt', {
    type: 'text/plain',
  });
  await deposition.createFiles([secondFileData, thirdFileData]);

  const fourthFileData = new File(['Hello, world 4!'], 'example4.txt', {
    type: 'text/plain',
  });
  await deposition.createFilesAsZip([fourthFileData], 'example4.zip');

  const files = await deposition.listFiles();
  expect(files.length).toBe(4);
  await deposition.deleteAllFiles();
  const emptyFiles = await deposition.listFiles();
  expect(emptyFiles.length).toBe(0);

  if (typeof deposition.value.id === 'number') {
    await zenodo.deleteDeposition(deposition.value.id);
  } else {
    throw new Error('Deposition ID is undefined');
  }

  const logs = logger.getLogs();
  expect(logs.length).toBeGreaterThanOrEqual(14);
}, 10000);

test('add to community', async () => {
  const logger = new FifoLogger();
  const zenodo = new Zenodo({
    host: 'sandbox.zenodo.org',
    accessToken: config.accessToken || '',
    logger,
  });
  const depositionMetadata: ZenodoMetadata = {
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
  const deposition = await zenodo.createDeposition(depositionMetadata);
  const firstFileData = new File(['Hello, World!'], 'example.txt', {
    type: 'text/plain',
  });
  await deposition.createFile(firstFileData);
  expect(deposition.value.id).toBeDefined();
  const communityId = '24dd3aa0-38b4-415d-b038-cf71aa67e187';
  const request = await deposition.addToCommunity(communityId);
  expect(request).toBeDefined();
  expect(request).toHaveProperty('links.actions');
  // @ts-expect-error request is unknown type
  expect(request.receiver.community).toBe(communityId);
  // @ts-expect-error request is unknown type
  expect(request.topic.record).toBeDefined();
  // @ts-expect-error request is unknown type
  expect(request.topic.record).toEqual(String(deposition.value.id));
});

test.todo('publish deposition', async () => {
  const logger = new FifoLogger();
  const zenodo = new Zenodo({
    host: 'sandbox.zenodo.org',
    accessToken: config.accessToken || '',
    logger,
  });

  const depositionMetadata: ZenodoMetadata = {
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

  const deposition = await zenodo.createDeposition(depositionMetadata);
  expect(deposition.value.id).toBeDefined();

  const publishedDeposition = await deposition.publish();
  expect(publishedDeposition.value.id).toBe(deposition.value.id);
  expect(publishedDeposition.value.state).toBe('done');
  expect(publishedDeposition.value.submitted).toBe(true);

  const newVersion = await publishedDeposition.newVersion();
  expect(newVersion.value.id).not.toBe(deposition.value.id);
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

  const depositionMetadata: ZenodoMetadata = {
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

  const deposition = await zenodo.createDeposition(depositionMetadata);
  expect(deposition.value.id).toBeDefined();

  await deposition.submitForReview();
  await zenodo.retrieveRequests();
});
