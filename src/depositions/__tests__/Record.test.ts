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
  const depositions = await zenodo.listRecords();
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

  const record = await zenodo.createRecord(depositionMetadata);
  console.log(`Created record with ID: ${record.value.id}`);

  const file1 = new File(['test content 1'], 'test1.txt', {
    type: 'text/plain',
  });
  const file2 = new File(['test content 2'], 'test2.txt', {
    type: 'text/plain',
  });

  const results = await record.uploadFiles([file1, file2]);

  expect(results).toHaveLength(2);
  expect(results[0]?.value.filename).toBe('test1.txt');

  const files = await record.listFiles();
  expect(files).toHaveLength(2);
});
