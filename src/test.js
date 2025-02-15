const ACCESS_TOKEN =
  'Nrh8j31B2pGmQ5jDRkYJhfdHcexKYlNsWZkPUdJhj3A7wIa38ZCAjhnbGrr1';

const requestParams = {};

//

const url = `https://sandbox.zenodo.org/api/deposit/depositions`;

// need to post to using fetch
const response = await fetch(url, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${ACCESS_TOKEN}`,
  },
});

console.log(response.status);

const data = await response.json();
console.log(data);
