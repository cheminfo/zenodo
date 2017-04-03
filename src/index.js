'use strict';

const request = require('request-promise-native');

const defaultOptions = {
    protocol: 'https',
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
        const baseUrl = options.protocol + '://' + options.host + options.pathPrefix;
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

    get depositions() {
        return this[kSublevel].depositions || (this[kSublevel].depositions = new ZenodoApiDepositions(this[kRequest], this[kBaseUrl]));
    }

    get files() {
        return this[kSublevel].files || (this[kSublevel].files = new ZenodoApiFiles(this[kRequest], this[kBaseUrl]));
    }
}

class ZenodoApiDepositions {
    constructor(request, baseUrl) {
        this[kRequest] = request.defaults({baseUrl: baseUrl + 'deposit/depositions/'});
    }

    list(options) {
        return this[kRequest].get('/', {
            qs: options
        });
    }

    create(options = {}) {
        const {metadata = {}} = options;
        return this[kRequest].post('/', {
            body: {metadata}
        });
    }

    retrieve(options = {}) {
        const {id} = options;
        return this[kRequest].get(`/${id}`);
    }

    update(options = {}) {
        const {
            id,
            metadata = {}
        } = options;

        return this[kRequest].put(`/${id}`, {
            body: {metadata}
        });
    }

    delete(options) {
        const {id} = options;
        return this[kRequest].delete(`/${id}`);
    }

    publish(options = {}) {
        const {id} = options;
        return this[kRequest].post(`/${id}/actions/publish`);
    }

    edit(options = {}) {
        const {id} = options;
        return this[kRequest].post(`/${id}/actions/edit`);
    }

    discard(options = {}) {
        const {id} = options;
        return this[kRequest].post(`/${id}/actions/discard`);
    }
}

class ZenodoApiFiles {
    constructor(request, baseUrl) {
        this[kRequest] = request.defaults({baseUrl: baseUrl + 'files/'});
    }

    upload(options = {}) {
        const {
            deposition,
            filename,
            contentType = 'application/octet-stream',
            data
        } = options;
        const bucketId = deposition ? getBucketId(deposition) : options.bucketId;
        return this[kRequest].put(`/${bucketId}/${filename}`, {
            body: data,
            json: false,
            headers: {
                'Content-Type': contentType,
                'Accept': 'application/json'
            }
        });
    }

    delete(options = {}) {
        const {
            deposition,
            versionId,
            filename
        } = options;
        const bucketId = deposition ? getBucketId(deposition) : options.bucketId;
        return this[kRequest].delete(`/${bucketId}/${filename}`, {
            qs: {
                versionId
            }
        });
    }
}

function getBucketId(deposition) {
    return deposition.links.bucket.replace(/.*\//, '');
}

module.exports = ZenodoApi;
