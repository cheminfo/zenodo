import { test, expect } from 'vitest';
import { Zenodo } from '../Zenodo.1.js';

import { getConfig } from './getConfig';
const config = getConfig();

test('no token', async () => {
  // test error
  expect(() => {
    new Zenodo({
      host: 'sandbox.zenodo.org',
    });
  }).toThrow('accessToken is required');
});

test.only('authenticate', async () => {
  console.log(config);
  const zenodo = new Zenodo({
    host: 'sandbox.zenodo.org',
    accessToken: config.accessToken,
  });

  const depositions = await zenodo.listDepositions();
  console.log('------------');
  console.log(depositions);
});
