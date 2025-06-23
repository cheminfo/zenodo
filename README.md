# zenodo

Node.js library to access the Zenodo API

## Zenodo API Documentation

https://developers.zenodo.org/

## Testing the project

In order to test the project you will have to create a .env file that contains an API key to the sandbox.

https://developers.zenodo.org/#authentication

## Usage

```js
// by default we set the host to 'sandbox.zenodo.org' so that you can easily play around with this library without damage
const zenodo = new Zenodo({ accessToken, host: 'zenodo.org' });

// retrieve the list of all the depositions
const depositions = await zenodo.listDepositions();
for (const deposition of depoositions) {
  console.log(deposition);
}

// create a new deposition
const deposition = zenodo.createDeposition({
  upload_type: 'dataset',
  description: 'test',
  access_right: 'open',
  creators: [
    {
      name: 'test',
    },
  ],
});
const firstDeposition = await zenodo.createDeposition(depositionMetadata);

const firstFile = new File(['Hello, world!'], 'example.txt', {
  type: 'text/plain',
});
const newFile = await firstDeposition.createFile(firstFile);

const secondFile = new File(['Hello, world 2!'], 'example2.txt', {
  type: 'text/plain',
});
const newFile2 = await firstDeposition.createFile(secondFile);

await firstDeposition.deleteFile(newFile.id);
await firstDeposition.deleteFile(newFile2.id);

// alternatively you can upload both files at once
await firstDeposition.createFiles([firstFile, secondFile]);

// you can also create a zip contains many files
await firstDeposition.createFilesAsZip([firstFile, secondFile], {
  zipName: 'data.zip',
});
```

## Development
