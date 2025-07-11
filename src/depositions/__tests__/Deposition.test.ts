import delay from 'delay';
import { FifoLogger } from 'fifo-logger';
import { test, expect } from 'vitest';

import { Zenodo } from '../../Zenodo.ts';
import type { ZenodoMetadata } from '../../utilities/ZenodoMetadataSchema.ts';

import { getConfig } from './getConfig.ts';

const config = getConfig();

test('basic deposition manipulations', async () => {
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
    title: 'test dataset from npm library zenodo',
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
  await deposition.createFilesAsZip([fourthFileData], {
    zipName: 'example4.zip',
  });

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
  expect(logs.length).toBeGreaterThanOrEqual(17);
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
    title: 'test dataset from npm library zenodo',
    creators: [
      {
        name: 'test',
      },
    ],
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

// skipping this test as it makes the deposition undeletable by publishing it
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
    title: 'test dataset from npm library zenodo',
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
  expect(newVersion.value.state).toBe('draft');

  // @ts-expect-error newVersion is unknown type
  const versions = await zenodo.retrieveVersions(newVersion.value.id);
  expect(versions.length).toBeGreaterThan(0);
  const latestVersion = versions.find(
    // @ts-expect-error version is unknown type
    (version) => version.metadata.relations.version[0].is_last === true,
  );

  expect(latestVersion).toBeDefined();
});

test.skip('submit for review', async () => {
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
    title: 'test dataset from npm library zenodo',
    creators: [
      {
        name: 'test',
      },
    ],
  };

  const deposition = await zenodo.createDeposition(depositionMetadata);
  expect(deposition.value.id).toBeDefined();

  const submittedDeposition = await deposition.submitForReview();
  expect(submittedDeposition.value.id).toBe(deposition.value.id);
});
