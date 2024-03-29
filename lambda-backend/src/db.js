'use strict';

const dynamodb = require('aws-sdk/clients/dynamodb')

const client = process.env.AWS_SAM_LOCAL ?
    new dynamodb.DocumentClient({endpoint: 'http://host.docker.internal:8000'}) // use local db when running locally
    : new dynamodb.DocumentClient()

const tableName =  process.env.TABLE_NAME

async function getItemByKey(db, key) {
    let dbResponse = await db.client.get({TableName: db.tableName, Key: key}).promise();
    if (dbResponse.Item) {
        return dbResponse.Item;
    }
    throw new Error("Could not find db item with these keys.");
}

module.exports = {
    tableName,
    client,
    getItemByKey
}

