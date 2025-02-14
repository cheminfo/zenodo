const fs = require('fs');

const Zenodo = require('./src');

const zenodo = new Zenodo({
  host: 'sandbox.zenodo.org',
});
zenodo.authenticate(require('./testAuth.json'));

const testFile = fs.readFileSync('LICENSE');

// List
(async function () {
  const deposits = await zenodo.depositions.list();
  console.log(deposits.length);
  /*const entry = await zenodo.depositions.create({
        metadata: {
            upload_type: 'dataset',
            description: 'This is my description',
            title: 'This is my title'
        }
    });*/
  const entry = await zenodo.depositions.retrieve({
    id: 71287,
  });
  /*const upload = await zenodo.files.upload({
        deposition: entry,
        filename: encodeURIComponent('my filename/with $special&characters2.txt'),
        contentType: 'text/plain',
        data: testFile
    });*/
  const deleted = await zenodo.files.delete({
    deposition: entry,
    versionId: '7eaf2ecf-e414-46d7-9d93-26382925e596',
    filename: encodeURIComponent('my filename/with $special&characters2.txt'),
  });
  console.log(deleted);
})().catch(function (e) {
  console.log(e.response.body);
});
