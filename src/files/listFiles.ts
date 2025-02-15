import type { Zenodo } from '../Zenodo';
import { responseStatuses } from '../responseStatuses';
import type { ZenodoFile } from '../types';

export async function listFiles(
  zenodo: Zenodo,
  depositionId: number,
): Promise<ZenodoFile[]> {
  const url = `https://${zenodo.host}/api/deposit/depositions/${depositionId}/files`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
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
