import fs from 'node:fs';

import { ZipWriter } from '@zip.js/zip.js';
import dotenv from 'dotenv';

import { Zenodo } from '../../src/index.ts'; // Assuming zenodo-js is installed

dotenv.config({ path: './.env' });

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

function createFileReadme(file) {
    const md = [];
    md.push(`# ${file.content.general.title || 'Untitled File'}`);
    md.push('## Description');
    md.push(file.content.general.description || '_No description provided._');
    md.push('');

function zenodoToMarkdown(dep) {
  const md = [];
  const meta = dep.metadata || {};

  md.push(`# ${meta.title || dep.title || 'Untitled Deposition'}`);
  if (meta.prereserve_doi?.doi) {
    md.push(
      `**DOI:** [${meta.prereserve_doi.doi}](https://doi.org/${meta.prereserve_doi.doi})`,
    );
  }

  if (meta.description) {
    md.push(`## Description`, meta.description, '');
  }

  md.push(
    '',
    `| Field         | Value |`,
    `|-------------- |-------|`,
    `| **Deposition ID** | ${dep.id || 'N/A'} |`,
    `| **Created**       | ${dep.created || 'N/A'} |`,
    `| **Modified**      | ${dep.modified || 'N/A'} |`,
    `| **State**         | ${dep.state || 'N/A'} |`,
    `| **Access Right**  | ${meta.access_right || 'N/A'} |`,
    `| **License**       | ${meta.license || 'N/A'} |`,
    `| **Upload Type**   | ${meta.upload_type || 'N/A'} |`,
    `| **Publisher**     | ${meta.imprint_publisher || 'N/A'} |`,
    `| **Publication Date** | ${meta.publication_date || 'N/A'} |`,
    '',
    `## Creators`,
  );
  if (Array.isArray(meta.creators) && meta.creators.length > 0) {
    for (const [i, c] of meta.creators.entries()) {
      md.push(
        `- [**${c.name}**${c.affiliation ? ` (${c.affiliation})` : ''}](${c.orcid ? `https://orcid.org/${c.orcid}` : ''})`,
      );
    }
  } else {
    md.push('_No creators listed._');
  }
  md.push('', `## Links`);
  if (dep.links && typeof dep.links === 'object') {
    if (dep.links.html) md.push(`- [Zenodo Page](${dep.links.html})`);
    if (dep.links.self) md.push(`- [API Resource](${dep.links.self})`);
    if (dep.links.bucket) md.push(`- [Bucket](${dep.links.bucket})`);
  }
  md.push('', `## Files`);
  if (Array.isArray(dep.files) && dep.files.length > 0) {
    md.push(`| Filename | Size | Checksum |`, `|----------|------|----------|`);
    for (const f of dep.files) {
      md.push(
        `| ${f.filename} | ${formatBytes(f.filesize)} | \`${f.checksum}\` |`,
      );
    }
  } else {
    md.push('_No files uploaded._');
  }
  md.push('');

  return md.join('\n');
}

const baseUrl = 'https://mydb.cheminfo.org/db/eln/entry/';
/* const sampleIDs = [
  'dfbfcbeebff605772b82a469b71f70b0',
  '9c0b3752f13beab24558f23580d7f11b',
]; */
const sampleIDs = [
  'c4877ccdd10c3975acb0da4ad05a8640',
  'a148714d1f0d657f2de7318cf2b85af8',
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
        const blob = await new Blob([await res.arrayBuffer()]).stream();
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

console.log(toc[0].content.spectra);
files.push(
  new File([JSON.stringify(toc, null, 2)], 'toc.json', {
    type: 'application/json',
  }),
);

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

const markdown = zenodoToMarkdown(updatedDeposition.value);
const markdownFile = new File(
  [JSON.stringify(markdown, null, 2)],
  'README.md',
  {
    type: 'application/json',
  },
);

await deposition.createFile(markdownFile);

fs.writeFileSync('scripts/deposition-summary.md', markdown, 'utf8');
console.log('Markdown file created: deposition-summary.md');

if (deposition.value.id !== undefined) {
  await zenodo.deleteDeposition(deposition.value.id);
} else {
  throw new Error('Deposition ID is undefined.');
}
