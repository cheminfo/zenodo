/* eslint-disable no-new */
import { test, expect } from 'vitest';

import { Zenodo } from '../Zenodo';
import type { Deposition } from '../types';

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
  // console.log({ existing });

  const newDeposition: Deposition = {
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

  const created = await zenodo.createDeposition(newDeposition);
  // console.log({ created });

  // we could attach a file. We need a 'native' web file
  const fileToUpload = new File(['Hello, world!'], 'example.txt', {
    type: 'text/plain',
  });

  const newFile = await zenodo.createFile(created.id, fileToUpload);
  expect(newFile.filesize).toBe(13);
  expect(newFile.checksum).toBe('6cd3556deb0da54bca060b4c39479839');

  const fileToUpload2 = new File(['Hello, world 2!'], 'example2.txt', {
    type: 'text/plain',
  });
  const newFile2 = await zenodo.createFile(created.id, fileToUpload2);
  expect(newFile2.filesize).toBe(15);
  expect(newFile2.checksum).toBe('9500d92e2fa89ecbdc90cd890ca16ed0');

  const files = await zenodo.listFiles(created.id);

  files.sort((a, b) => a.filename.localeCompare(b.filename));

  expect(files).toHaveLength(2);

  await zenodo.deleteFile(created.id, files[1].id);
  const filesAfterDelete = await zenodo.listFiles(created.id);
  expect(filesAfterDelete).toHaveLength(1);

  const file3 = await zenodo.retrieveFile(created.id, files[0].id);
  expect(file3.filename).toBe('example.txt');

  const content = await fetch(file3.links.download, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${zenodo.accessToken}`,
    },
  }).then((res) => res.text());
  expect(content).toBe('Hello, world!');

  // we delete everything
  for (const deposition of existing) {
    await zenodo.deleteDeposition(deposition.id);
  }
});
