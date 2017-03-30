'use strict';

const request = require('request-promise-native');

const defaultOptions = {
    host: 'zenodo.org',
    pathPrefix: '/api/'
};

const kBaseRequest = Symbol('baseRequest');
const kBaseUrl = Symbol('baseUrl');
const kRequest = Symbol('request');
const kSublevel = Symbol('sublevel');

class ZenodoApi {
    constructor(options) {
        options = Object.assign({}, defaultOptions, options);
        const baseUrl = 'https://' + options.host + options.pathPrefix;
        this[kBaseUrl] = baseUrl;
        this[kBaseRequest] = request.defaults({
            baseUrl,
            json: true
        });
        this[kRequest] = this[kBaseRequest];
        this[kSublevel] = {};
    }

    authenticate(options = {}) {
        if (!options.token) {
            throw new Error('token option must be provided');
        }
        this[kRequest] = this[kBaseRequest].defaults({
            auth: {
                bearer: options.token
            }
        });
        this[kSublevel] = {};
    }

    get deposit() {
        return this[kSublevel].deposit || (this[kSublevel].deposit = new ZenodoApiDeposit(this[kRequest], this[kBaseUrl]));
    }
}

class ZenodoApiDeposit {
    constructor(request, baseUrl) {
        this[kRequest] = request.defaults({
            baseUrl: baseUrl + 'deposit/'
        });
    }

    depositions(options) {
        return this[kRequest].get('/depositions', {
            qs: options
        });
    }

    create(metadata = {}) {
        return this[kRequest].post('/depositions', {
            body: {metadata}
        });
    }
}

module.exports = ZenodoApi;
