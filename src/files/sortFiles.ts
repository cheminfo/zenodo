import type { Zenodo } from '../Zenodo';
import { responseStatuses } from '../responseStatuses';
import type { ZenodoFile } from '../types';

export async function sortFiles(
  zenodo: Zenodo,
  depositionId: number,
  files: Array<{ id: string }>,
): Promise<ZenodoFile[]> {
  const url = `https://${zenodo.host}/api/deposit/depositions/${depositionId}/files`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${zenodo.accessToken}`,
    },
    body: JSON.stringify(files),
  });

  if (response.status !== 200) {
    throw new Error(
      responseStatuses[response.status]?.message || response.statusText,
    );
  }
  return response.json();
}
