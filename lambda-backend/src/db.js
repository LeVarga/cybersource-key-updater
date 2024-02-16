'use strict';

const dynamodb = require('aws-sdk/clients/dynamodb')

const client = process.env.AWS_SAM_LOCAL ?
    new dynamodb.DocumentClient({endpoint: 'http://host.docker.internal:8000'}) // use local db when running locally
    : new dynamodb.DocumentClient()

const tableName =  process.env.TABLE_NAME

module.exports = {
    tableName,
    client
}