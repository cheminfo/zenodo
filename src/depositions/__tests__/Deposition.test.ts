import delay from 'delay';
import { FifoLogger } from 'fifo-logger';
import { test, expect } from 'vitest';

import { Zenodo } from '../../Zenodo';
import type { ZenodoMetadata } from '../../utilities/ZenodoMetadataSchema.ts';

import { getConfig } from './getConfig';

const config = getConfig();

test('deposition manipulations', async () => {
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
  const firstFileData = new File(['Hello, damned world!'], 'example.txt', {
    type: 'text/plain',
  });
  await deposition.createFile(firstFileData);
  await delay(1000); // wait for the file to be processed

  const secondFileData = new File(['Goodbye, world!'], 'example2.txt', {
    type: 'text/plain',
  });
  await deposition.createFile(secondFileData);

  const files = await deposition.listFiles();
  console.log(files);
  expect(files.length).toBe(2);

  await zenodo.deleteDeposition(deposition.value.id);
});
