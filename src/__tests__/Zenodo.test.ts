/* eslint-disable no-await-in-loop */
/* eslint-disable no-new */
import { test, expect } from 'vitest';

import { Zenodo } from '../Zenodo';
import type { DepositionMetadata } from '../depositions/types';

import { getConfig } from './getConfig';

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
  const zenodo = new Zenodo({
    host: 'sandbox.zenodo.org',
    accessToken: config.accessToken || '',
  });

  const existing = await zenodo.listDepositions();

  const depositionMetadata: DepositionMetadata = {
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
  expect(firstFile.filesize).toBe(13);
  expect(firstFile.checksum).toBe('6cd3556deb0da54bca060b4c39479839');

  const secondFileData = new File(['Hello, world 2!'], 'example2.txt', {
    type: 'text/plain',
  });
  const secondFile = await firstDeposition.createFile(secondFileData);
  expect(secondFile.filesize).toBe(15);
  expect(secondFile.checksum).toBe('9500d92e2fa89ecbdc90cd890ca16ed0');

  const files = await firstDeposition.listFiles();
  files.sort((a, b) => a.filename.localeCompare(b.filename));

  expect(files).toHaveLength(2);

  await firstDeposition.deleteFile(files[1].id);
  const filesAfterDelete = await firstDeposition.listFiles();
  expect(filesAfterDelete).toHaveLength(1);

  const retrievedFile = await firstDeposition.retrieveFile(files[0].id);
  expect(retrievedFile.filename).toBe('example.txt');

  const content = await retrievedFile
    .getContentResponse()
    .then((response) => response.text());

  expect(content).toBe('Hello, world!');

  // we delete everything
  for (const deposition of existing) {
    await zenodo.deleteDeposition(deposition.id);
  }
});
