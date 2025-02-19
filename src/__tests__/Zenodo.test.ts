/* eslint-disable no-new */
import { test, expect } from 'vitest';

import { Zenodo } from '../Zenodo';

import { getConfig } from './getConfig';

const config = getConfig();

test('no token', async () => {
  // test error
  expect(() => {
    new Zenodo({
      host: 'sandbox.zenodo.org',
    });
  }).toThrow('accessToken is required');
});

test.only('authenticate', async () => {
  const zenodo = new Zenodo({
    host: 'sandbox.zenodo.org',
    accessToken: config.accessToken,
  });

  const existing = await zenodo.listDepositions();

  const depositionMetadata: Deposition = {
    title: 'test dataset from npm library zenodo',
    metadata: {
      upload_type: 'dataset',
      description: 'test',
      creators: [
        {
          name: 'test',
        },
      ],
    },
  };

  const firstDeposition = await zenodo.createDeposition(depositionMetadata);
  // we could attach a file. We need a 'native' web file
  const firstFile = new File(['Hello, world!'], 'example.txt', {
    type: 'text/plain',
  });

  // await createFile(zenodo, firstDeposition.id, firstFile);

  const newFile = await firstDeposition.createFile(firstFile);
  expect(newFile.filesize).toBe(13);
  expect(newFile.checksum).toBe('6cd3556deb0da54bca060b4c39479839');

  const secondFile = new File(['Hello, world 2!'], 'example2.txt', {
    type: 'text/plain',
  });
  const newFile2 = await firstDeposition.createFile(secondFile);
  expect(newFile2.filesize).toBe(15);
  expect(newFile2.checksum).toBe('9500d92e2fa89ecbdc90cd890ca16ed0');

  const files = await firstDeposition.listFiles();
  files.sort((a, b) => a.filename.localeCompare(b.filename));

  expect(files).toHaveLength(2);

  await firstDeposition.deleteFile(files[1].id);
  const filesAfterDelete = await firstDeposition.listFiles();
  expect(filesAfterDelete).toHaveLength(1);

  const retrievedFile = await firstDeposition.retrieveFile(files[0].id);
  expect(retrievedFile.filename).toBe('example.txt');

  const content = await fetch(retrievedFile.links.download, {
    headers: {
      Authorization: `Bearer ${zenodo.accessToken}`,
    },
  }).then((res) => res.text());
  expect(content).toBe('Hello, world!');

  // we delete everything
  for (const deposition of existing) {
    await zenodo.deleteDeposition(deposition.id);
  }
});
