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
        return zenodo.deposit.create().then(console.log);
    });
});
