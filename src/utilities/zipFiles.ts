import { ZipWriter } from '@zip.js/zip.js';

/**
 *
 * This function zips an array of File objects into a single zip file.
 * @param files - Array of File objects to be zipped
 * @param zipName - The name of the resulting zip file (without extension)
 * @returns A promise that resolves to a File object representing the zip file.
 */
export async function zipFiles(files: File[], zipName: string): Promise<File> {
  const zipFileStream = new TransformStream();
  const zipFileBlobPromise = new Response(zipFileStream.readable).blob();

  const zipWriter = new ZipWriter(zipFileStream.writable);

  const attachmentPromises = files.map(async (file) => {
    const blob = new Blob([await file.arrayBuffer()]).stream();
    await zipWriter.add(file.name, blob);
  });
  await Promise.all(attachmentPromises);
  await zipWriter.close();

  const zipFile = await zipFileBlobPromise;
  if (zipFile.size > 50 * 1024 * 1024 * 1024) {
    throw new Error(`Zip file exceeds Zenodo's 50GB limit.`);
  }

  const zipFileBlob = await zipFileBlobPromise;

  return new File([zipFileBlob], `${zipName}.zip`, {
    type: 'application/zip',
  });
}
