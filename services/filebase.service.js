const AWS = require('aws-sdk');
const Q = require('q');
require('dotenv').config();

const endpoint = process.env.S3_ENDPOINT;
const signatureVersion = process.env.S3_SIGNATUREVERSION;
const accessKeyId = process.env.S3_ACCESSKEYID;
const secretAccessKey = process.env.S3_SECRETACCESSKEY;

const s3 = new AWS.S3({ endpoint, signatureVersion, accessKeyId, secretAccessKey });

async function listBuckets() {
    const deferred = Q.defer();

    s3.listBuckets(function (err, data) {
        if (err) {
            console.log(err, err.stack); // an error occurred
            const response = { status: 'failed', error: err }
            deferred.resolve(response)
        } else {
            const response = { status: 'success', data }
            deferred.resolve(response)
        }
    });
    return deferred.promise;
}

function listObjects(params) {
    const deferred = Q.defer();

    s3.listObjectsV2(params, function (err, data) {
        if (err) {
            console.log(err, err.stack); // an error occurred
            const response = { status: 'failed', error: err }
            deferred.resolve(response)
        } else {
            const response = { status: 'success', data }
            deferred.resolve(response)
        }
    });
    return deferred.promise;
}

function putObject(params) {
    const deferred = Q.defer();
    s3.putObject(params, function (err, data) {
        if (err) {
            deferred.resolve({ status: 'failed', error: err })
        } else {
            deferred.resolve({ status: 'success', data })
        }
    });
    return deferred.promise;
}

function getObject(params) {
    const deferred = Q.defer();
    s3.getObject(params, function (err, data) {
        if (err) {
            deferred.resolve({ status: 'failed', error: err })
        } else {
            deferred.resolve({ status: 'success', data })
        }
    });
    return deferred.promise;
}

function deleteObject(params) {
    const deferred = Q.defer();
    s3.deleteObject(params, function (err, data) {
        if (err) {
            deferred.resolve({ status: 'failed', error: err })
        } else {
            deferred.resolve({ status: 'success', data })
        }
    });
    return deferred.promise;
}

module.exports = {
    listBuckets,
    listObjects,
    putObject,
    getObject,
    deleteObject
};