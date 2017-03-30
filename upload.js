var request = require('request-promise-native');

request.post({
	url: /*'http://localhost:2000',//*/'https://sandbox.zenodo.org/api/deposit/depositions/71255/files?access_token=waIqAmt1K1dqoT36EvXthYqY4pA4U0gaSlC7H33rhT4zOfZkaMGuUBIhkv7I',
	formData: {
		name: 'myFile.txt',
		file: {value:'text', options:{filename: 'abc.txt',contentType: 'text/plain'}}//Buffer.from('test')
	}
}).catch(console.error);
