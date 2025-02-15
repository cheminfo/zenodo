import type { Zenodo } from '../Zenodo';
import { responseStatuses } from '../responseStatuses';
import type { ZenodoFile } from '../types';

export async function retrieveFile(
  zenodo: Zenodo,
  depositionId: number,
  fileId: number,
): Promise<ZenodoFile> {
  const url = `https://${zenodo.host}/api/deposit/depositions/${depositionId}/files/${fileId}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${zenodo.accessToken}`,
    },
  });
  if (response.status !== 200) {
    throw new Error(
      responseStatuses[response.status]?.message || response.statusText,
    );
  }
  return response.json();
}
