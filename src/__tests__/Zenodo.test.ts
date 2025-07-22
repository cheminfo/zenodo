/* eslint-disable no-await-in-loop */
import { FifoLogger } from 'fifo-logger';
import { test, expect, afterEach } from 'vitest';

import { Zenodo } from '../Zenodo.ts';
import type { ZenodoMetadata } from '../utilities/ZenodoMetadataSchema.ts';

import { getConfig } from './getConfig.ts';

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

test('no token', async ({ expect }) => {
  // @ts-expect-error we are testing the error
  const zenodo = new Zenodo({
    host: 'sandbox.zenodo.org',
  });
  const publicDepositions = await zenodo.retrieveRecord(290289);
  expect(publicDepositions.value.id).toBe(290289);
  await expect(publicDepositions.getDeposition()).rejects.toThrow(
    'Access token is required to retrieve a deposition',
  );
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
    upload_type: 'dataset',
    description: 'test zenodo authentication',
    access_right: 'open',
    title: 'test zenodo authentication',
    creators: [
      {
        name: 'test',
      },
    ],
    license: 'cc-by-1.0',
  };

  const firstDeposition = await zenodo.createDeposition(depositionMetadata);
  const retrievedDeposition = await zenodo.retrieveDeposition(
    // @ts-expect-error value may be undefined
    firstDeposition.value.id,
  );
  expect(retrievedDeposition.value.id).toBe(firstDeposition.value.id);
  // we could attach a file. We need a 'native' web file
  const firstFileData = new File(['Hello, world!'], 'example.txt', {
    type: 'text/plain',
  });
  const firstFile = await firstDeposition.createFile(firstFileData);
  expect(firstFile.value.filesize).toBe(13);
  expect(firstFile.value.checksum).toBe('6cd3556deb0da54bca060b4c39479839');

  const secondFileData = new File(['Hello, world 2!'], 'example2.txt', {
    type: 'text/plain',
  });
  const secondFile = await firstDeposition.createFile(secondFileData);
  expect(secondFile.value.filesize).toBe(15);
  expect(secondFile.value.checksum).toBe('9500d92e2fa89ecbdc90cd890ca16ed0');
  const thirdFileData = new File(['Hello, world 3!'], 'example3.txt', {
    type: 'text/plain',
  });
  const thirdFile = await firstDeposition.createFilesAsZip(
    [thirdFileData],
    'example3',
  );

  expect(thirdFile[0]?.value.filename).toBe('example3.zip');
  // @ts-expect-error thirdFile is possibly undefined
  expect(thirdFile[0].value.filesize).toBe(269);

  const files = await firstDeposition.listFiles();
  files.sort((a, b) => a.value.filename.localeCompare(b.value.filename));

  expect(files).toHaveLength(3);

  // @ts-expect-error files[1] is not typed in zenodo
  await firstDeposition.deleteFile(files[1].value.id);
  const filesAfterDelete = await firstDeposition.listFiles();
  expect(filesAfterDelete).toHaveLength(2);

  // @ts-expect-error files[0] is not typed in zenodo
  const retrievedFile = await firstDeposition.retrieveFile(files[0].value.id);
  expect(retrievedFile.value.filename).toBe('example.txt');

  const content = await retrievedFile
    .getContentResponse()
    .then((response) => response.text());

  expect(content).toBe('Hello, world!');

  const requests = await zenodo.retrieveRequests();
  expect(requests.hits.total).toBe(0);

  const versions = await zenodo.retrieveVersions(287116);
  expect(versions.length).toBeGreaterThanOrEqual(2);
  // @ts-expect-error versions is not typed in zenodo
  expect(versions[0].id).toBe(287116);

  const logs = logger.getLogs();
  expect(logs.length).toBeGreaterThanOrEqual(11);
}, 15000);
