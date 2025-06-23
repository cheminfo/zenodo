/* eslint-disable no-await-in-loop */
/* eslint-disable no-new */
import { FifoLogger } from 'fifo-logger';
import { test, expect } from 'vitest';

import { Zenodo } from '../Zenodo.ts';
import type { ZenodoMetadata } from '../utilities/ZenodoMetadataSchema.ts';

import { getConfig } from './getConfig.ts';

const config = getConfig();

test('no token', async () => {
  expect(() => {
    // @ts-expect-error we are testing the error
    new Zenodo({
      host: 'sandbox.zenodo.org',
    });
  }).toThrow('accessToken is required');
});

test('authenticate', async () => {
  const logger = new FifoLogger();
  const zenodo = new Zenodo({
    host: 'sandbox.zenodo.org',
    accessToken: config.accessToken || '',
    logger,
  });

  const existing = await zenodo.listDepositions();

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

  const firstDeposition = await zenodo.createDeposition(depositionMetadata);
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

  const files = await firstDeposition.listFiles();
  files.sort((a, b) => a.value.filename.localeCompare(b.value.filename));

  expect(files).toHaveLength(2);

  // @ts-expect-error files[1] is not typed in zenodo
  await firstDeposition.deleteFile(files[1].value.id);
  const filesAfterDelete = await firstDeposition.listFiles();
  expect(filesAfterDelete).toHaveLength(1);

  // @ts-expect-error files[0] is not typed in zenodo
  const retrievedFile = await firstDeposition.retrieveFile(files[0].value.id);
  expect(retrievedFile.value.filename).toBe('example.txt');

  const content = await retrievedFile
    .getContentResponse()
    .then((response) => response.text());

  expect(content).toBe('Hello, world!');

  // we delete everything
  for (const deposition of existing) {
    if (deposition.value.id !== undefined) {
      await zenodo.deleteDeposition(deposition.value.id);
    }
  }

  const logs = logger.getLogs();
  expect(logs).toHaveLength(9);
});
