import { responseStatuses } from './responseStatuses';
import type { ZenodoFile } from './types';
import { Zenodo } from './Zenodo';

export async function createFile(
  zenodo: Zenodo,
  depositionId: number,
  file: File,
): Promise<ZenodoFile> {
  const url = `https://${zenodo.host}/api/deposit/depositions/${depositionId}/files`;

  // need to send 2 variables: file that contains file.arrayBuffer and name that contains file.filename
  // we send as multipart/form-data

  const formData = new FormData();

  formData.append('file', new Blob([await file.arrayBuffer()]), file.name);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: 'Bearer ' + zenodo.accessToken,
    },
    body: formData,
  });

  if (response.status !== 201) {
    throw new Error(
      responseStatuses[response.status]?.message || response.statusText,
    );
  }
  return response.json();
}
