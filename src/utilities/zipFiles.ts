import { ZipWriter, configure } from '@zip.js/zip.js';

configure({
  useCompressionStream: true,
  useWebWorkers: false,
});

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

  const attachmentPromises = files.map((file) =>
    zipWriter.add(file.name, file.stream()),
  );

  await Promise.all(attachmentPromises);
  await zipWriter.close();

  const zipFileBlob = await zipFileBlobPromise;

  if (zipFileBlob.size > 50 * 1024 * 1024 * 1024) {
    throw new Error(`Zip file exceeds 50GB limit`);
  }

  return new File([zipFileBlob], `${zipName}.zip`, {
    type: 'application/zip',
  });
}
