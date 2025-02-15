import type { Deposition } from '../types';

export async function deleteDeposition(
  zenodo,
  id: number,
): Promise<Deposition> {
  const url = `https://${zenodo.host}/api/deposit/depositions/${id}`;
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${zenodo.accessToken}`,
    },
  });
  if (response.status !== 204) {
    throw new Error(response.statusText);
  }
}
