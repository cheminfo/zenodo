import type { Zenodo } from '../Zenodo';
import { responseStatuses } from '../responseStatuses';
import type { ZenodoFile } from '../types';

export async function deleteFile(
  zenodo: Zenodo,
  depositionId: number,
  fileId: string,
): Promise<ZenodoFile> {
  const url = `https://${zenodo.host}/api/deposit/depositions/${depositionId}/files/${fileId}`;

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${zenodo.accessToken}`,
    },
  });

  if (response.status !== 204) {
    throw new Error(
      responseStatuses[response.status]?.message || response.statusText,
    );
  }
  return response.text();
}
