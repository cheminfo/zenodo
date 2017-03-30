'use strict';

const ZenodoApi = require('..');
const testAuth = require('../testAuth.json');

describe('basic testing', () => {
    let zenodo;
    beforeEach(function () {
        zenodo = new ZenodoApi({
            host: 'sandbox.zenodo.org'
        });
        zenodo.authenticate(testAuth);
    });

    it('test', () => {
        return zenodo.deposit.create({
	    upload_type: 'dataset',
	    title: 'Test',
	    description: '<a href="https://www.cheminfo.org">CHEMINFO</a>'
	}).then(entry => {
	return entry.upload();
	});
    });
});
