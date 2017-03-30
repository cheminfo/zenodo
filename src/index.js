'use strict';

const defaultOptions = {
    host: 'zenodo.org',
    pathPrefix: '/api'
};

const kAuthToken = Symbol('authToken');

class ZenodoApi {
    constructor(options) {
        options = Object.assign({}, defaultOptions, options);
        // todo handle options
        this[kAuthToken] = null;
    }

    authenticate(options = {}) {
        if (!options.token) {
            throw new Error('token option must be provided');
        }
        this[kAuthToken] = options.token;
    }
}
