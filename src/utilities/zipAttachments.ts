import { ZipWriter } from '@zip.js/zip.js';

const baseUrl = 'https://mydb.cheminfo.org/db/eln/entry/';

async function fetchAndZipAttachments(entryId: string) {
  const response = await fetch(`${baseUrl}${entryId}`);
  const json = (await response.json()) as {
    _id: string;
    _attachments: Record<string, unknown>;
    [key: string]: unknown;
  };

  const zipFileStream = new TransformStream();
  const zipFileBlobPromise = new Response(zipFileStream.readable).blob();

  const zipWriter = new ZipWriter(zipFileStream.writable);

  const attachmentPromises = Object.keys(json._attachments).map(async (key) => {
    const attachmentUrl = `${baseUrl}${entryId}/${key}`;
    const res = await fetch(attachmentUrl);
    const blob = new Blob([await res.arrayBuffer()]).stream();
    await zipWriter.add(key, blob);
  });

  await Promise.all(attachmentPromises);
  await zipWriter.add(
    json._id,
    new Blob([JSON.stringify(json, null, 2)]).stream(),
  );

  await zipWriter.close();
  const zipFile = await zipFileBlobPromise;
  if (zipFile.size > 50 * 1024 * 1024 * 1024) {
    throw new Error(`Zip file for entry ${entryId} exceeds 50GB limit.`);
  }

  const zipFileBlob = await zipFileBlobPromise;
  const zipFileName = `${json._id}.zip`;

  return { blob: zipFileBlob, name: zipFileName };
}

/**
 * description This function fetches entries by their IDs, retrieves their attachments, and zips them.
 * It uses the ZipWriter from @zip.js/zip.js to create a zip file containing all attachments.
 * It processes each entry in parallel using Promise.all.
 * @param sampleIDs - Array of sample IDs to process
 * @returns A promise that resolves when all entries have been processed and zipped.
 * Each result is an object with 'blob' (the zip Blob) and 'name' (the filename).
 */
export async function zipAttachments(sampleIDs: string[]) {
  return await Promise.all(sampleIDs.map(fetchAndZipAttachments));
}
