import type { DepositionMetadata, Deposition } from '../types';

export async function createDeposition(
  zenodo,
  metadata: DepositionMetadata | {},
): Promise<Deposition> {
  const url = `https://${zenodo.host}/api/deposit/depositions`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${zenodo.accessToken}`,
    },
    body: JSON.stringify({ metadata }),
  });
  if (response.status !== 201) {
    throw new Error(response.statusText);
  }
  return response.json();
}
