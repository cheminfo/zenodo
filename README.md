# zenodo

Node.js library to access the Zenodo API

## Documentation

https://developers.zenodo.org/

## Testing the project

In order to test the project you will have to create a .env file that contains an API key to the sandbox.

https://developers.zenodo.org/#authentication

## Usage

```js
const zenodo = new Zenodo({ accessToken });

const depositions = zenodo.listDepositions();
for (const deposition of depoositions) {
}

const deposition = zenodo.createDeposition({
  title: 'test dataset from npm library zenodo',
  metadata: {
    upload_type: 'dataset',
    description: 'test',
    creators: [
      {
        name: 'test',
      },
    ],
  },
});

// we could attach a file. We need a 'native' web file
const blob = new Blob(['Hello, world!'], { type: 'text/plain' });
const file = new File([blob], 'example.txt', { type: 'text/plain' });

const newFile = await zenodo.createFile(created.id, file);

deposition.createFile();
```
