import { ZipWriter } from '@zip.js/zip.js';
import dotenv from 'dotenv';

import { Zenodo } from '../../src/index.ts';

dotenv.config({ path: './.env' });
const baseUrl = 'https://mydb.cheminfo.org/db/eln/entry/';
const sampleIDs = [
  'dfbfcbeebff605772b82a469b71f70b0',
  '9c0b3752f13beab24558f23580d7f11b',
];
const zenodo = new Zenodo({
  host: 'sandbox.zenodo.org',
  accessToken: (dotenv.config().parsed?.ACCESS_TOKEN ?? '') || '',
});
const toc = [];
const files = await Promise.all(
  sampleIDs.map(async (entryId) => {
    const response = await fetch(`${baseUrl}${entryId}`);
    const json = await response.json();
    const zipFileStream = new TransformStream();
    const zipFileBlobPromise = new Response(zipFileStream.readable).blob();

    const zipWriter = new ZipWriter(zipFileStream.writable);

    const attachmentPromises = Object.keys(json._attachments).map(
      async (key) => {
        const attachmentUrl = `${baseUrl}${entryId}/${key}`;
        const res = await fetch(attachmentUrl);
        const blob = new Blob([await res.arrayBuffer()]).stream();
        await zipWriter.add(key, blob);
      },
    );

    await Promise.all(attachmentPromises);
    const caption = json.$content.general.keyword.find(
      (keyword) => keyword.kind === 'caption',
    );
    const name = caption ? caption.value : json.$id.join('');

    await zipWriter.add(
      'index.json',
      new Blob([JSON.stringify(json.$content, null, 2)], {
        type: 'application/json',
      }).stream(),
    );

    await zipWriter.close();
    const zipFile = await zipFileBlobPromise;
    if (zipFile.size > 50 * 1024 * 1024 * 1024) {
      throw new Error(`Zip file for entry ${entryId} exceeds 50GB limit.`);
    }

    const zipFileBlob = await zipFileBlobPromise;
    const zipFileName = `${name}.zip`;
    toc.push({
      isZipped: true,
      content: json.$content,
      attachments: Object.keys(json._attachments),
    });
    return new File([zipFileBlob], zipFileName, {
      type: 'application/zip',
    });
  }),
);

files.push(
  new File([JSON.stringify(toc, null, 2)], 'toc.json', {
    type: 'application/json',
  }),
  new File(toc, 'README.md', {
    type: 'text/markdown',
  }),
);
console.log(toc);

const deposition = await zenodo.createDeposition({
  upload_type: 'dataset',
  description: 'test',
  access_right: 'open',
  title: 'ELN Fetch Modified Test',
  creators: [
    {
      name: 'test',
    },
  ],
});

await deposition.createFiles(
  files.map((file) => ({
    blob: file,
    name: file.name,
  })),
);

const updatedDeposition = await zenodo.retrieveDeposition(deposition.value.id);
console.log('Updated deposition:', updatedDeposition.value);

if (deposition.value.id !== undefined) {
  await zenodo.deleteDeposition(deposition.value.id);
} else {
  throw new Error('Deposition ID is undefined.');
}
