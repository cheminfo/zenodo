import type { DepositionMetadata, Deposition } from '../types';

export async function updateDeposition(
  zenodo,
  id: number,
  metadata: DepositionMetadata | {},
): Promise<Deposition> {
  const url = `https://${zenodo.host}/api/deposit/depositions/${id}`;
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${zenodo.accessToken}`,
    },
    body: JSON.stringify({ metadata }),
  });
}
