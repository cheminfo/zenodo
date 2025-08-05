import { BlobReader, ZipReader } from '@zip.js/zip.js';
import { test, expect } from 'vitest';

import { zipFiles } from '../zipFiles.ts';

test('upload zip attachments', async () => {
  const file1 = new File(['Hello, world!'], 'example1.txt', {
    type: 'text/plain',
  });
  const file2 = new File(['Hello, world 2!'], 'example2.txt', {
    type: 'text/plain',
  });
  const zippedFiles = await zipFiles([file1, file2], 'test-zip');

  expect(zippedFiles).toBeInstanceOf(File);
  expect(zippedFiles.name).toBe('test-zip.zip');
  expect(zippedFiles.size).equal(558);
  expect(zippedFiles.type).toBe('application/zip');

  // read the content of the zip file
  const zipFileReader = new BlobReader(zippedFiles);
  const zipReader = new ZipReader(zipFileReader);
  const stream = new TransformStream();
  const textPromise = new Response(stream.readable).text();
  const entries = await zipReader.getEntries();
  const firstEntry = entries.shift();
  // @ts-expect-error getData is not typed
  await firstEntry?.getData(stream.writable);
  await zipReader.close();
  expect(await textPromise).toBe('Hello, world!');
}, 30000);
