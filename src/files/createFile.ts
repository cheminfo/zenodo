import type { Zenodo } from '../Zenodo';
import { responseStatuses } from '../responseStatuses';
import type { ZenodoFile } from '../types';

export async function createFile(
  zenodo: Zenodo,
  depositionId: number,
  file: File,
): Promise<ZenodoFile> {
  const url = `https://${zenodo.host}/api/deposit/depositions/${depositionId}/files`;

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${zenodo.accessToken}`,
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
