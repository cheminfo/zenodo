import { ZipReader, BlobReader } from '@zip.js/zip.js';
import { test, expect } from 'vitest';

import { Zenodo } from '../../Zenodo';
import type { DepositionMetadata } from '../../depositions/depositionSchema';
import { zipAttachments } from '../zipAttachments';

import { getConfig } from './getConfig';

const config = getConfig();

test('upload zip attachments', async () => {
  const sampleIDs = [
    'dfbfcbeebff605772b82a469b71f70b0',
    '9c0b3752f13beab24558f23580d7f11b',
  ];

  const zipResults = await zipAttachments(sampleIDs);

  const zipFileReader = new BlobReader(zipResults[0].blob);

  const zipReader = new ZipReader(zipFileReader);
  const entries = await zipReader.getEntries();
  const firstEntry = entries.shift();
  await zipReader.close();

  const filename = firstEntry?.filename;
  expect(filename).toBeDefined();
  expect(filename).toBe('spectra/nmr/1h.jdx');

  const zenodo = new Zenodo({
    host: 'sandbox.zenodo.org',
    accessToken: config.accessToken || '',
  });

  const metadata: DepositionMetadata = {
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

  const deposition = await zenodo.createDeposition(metadata);
  await deposition.createFiles(zipResults);
  const files = await deposition.listFiles();
  files.sort((a, b) => a.value.filename.localeCompare(b.value.filename));
  expect(files).toHaveLength(2);
  const downloadedDeposition = await zenodo.retrieveDeposition(
    deposition.value.id,
  );
  const downloadedZip = await downloadedDeposition.retrieveFile(
    files[1].value.id,
  );
  const downloadedZipContentResponse = await downloadedZip.getContentResponse();
  const downloadedZipBlob = await downloadedZipContentResponse.blob();
  expect(downloadedZipBlob.size).equal(98752);

  const downloadedBlobReader = new BlobReader(downloadedZipBlob);
  const downloadedZipReader = new ZipReader(downloadedBlobReader);
  const downloadedEntries = await downloadedZipReader.getEntries();
  expect(downloadedEntries).toHaveLength(2);
  expect(downloadedEntries[0].filename).toBe('spectra/nmr/1h.jdx');
  await downloadedZipReader.close();

  await zenodo.deleteDeposition(deposition.value.id);
});
