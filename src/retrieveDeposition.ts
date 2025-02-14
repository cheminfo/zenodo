import { responseStatuses } from './responseStatuses';
import { Deposition } from './types';
import { Zenodo } from './Zenodo';

export async function retrieveDeposition(
  zenodo: Zenodo,
  id: number,
): Promise<Deposition> {
  const url = `https://${zenodo.host}/api/deposit/depositions/${id}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + zenodo.accessToken,
    },
  });
  if (response.status !== 200) {
    throw new Error(
      responseStatuses[response.status]?.message || response.statusText,
    );
  }
  return response.json();
}
