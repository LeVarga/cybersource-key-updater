'use strict';
const db = require("../db")
const jsonResponse = require("../jsonResponse")
const { v4: uuidv4 } = require('uuid');


const initialValues = [{ // TODO: Add more merchant IDs (they need new keys)
    merchantID: 'uci_cs180_2024_1708022268', keys: [
        {key: 'efb3de12-e6f8-423a-9b13-8f598643bcfa', secret: '0bRwwsrvao7LpTeAq5rfRj1gQv0KOsXR/tQiX4ErOBE='},
        {key: '39cdf174-8c34-4a8b-9188-fa6e21ba78b9', secret: 'YPL8ZZHb0s4PLunw3vQ1wLS7meOAHLu+zsPmP+M/yaU='},
        {key: '9eda4afd-3ce7-435d-bc6e-7f9eaa2169e7', secret: '5JDLXDblyVnJhOD7pKExKjDIgEEB+dIRL42UE0pO0po='},
        {key: '6f74b92f-511c-4375-9245-ad325f95c59b', secret: 'D7zNVHXP3HIchBlAiuK7Qn8RfC8XNIIRPpclIE+UbZU='},
        {key: 'c47a8a30-76fe-413f-85df-c3bdcc0bbb74', secret: 'wfkzYeW4RZKOrULhYcBz7ST/kRX5IBmZaVXxR+QQnyM='},
        {key: 'dd402d78-597d-448e-9ca6-eb5d9bc84402', secret: 'vvRyLnXnLXqDp3YXAruWh87RlbkhlIUVQ80RF7oBxtc='},
        {key: '7b02b815-6d60-44d8-8772-e9bc5773e0c4', secret: 'PRt8jJmWWe8T0WJzj/yD+OTnOhZu2WOGa66GDec+4Ec='},
        {key: '626f9656-e168-478c-8d18-1e0d3e4bff54', secret: 'nYu3avAjsZNXZwpIvcwsFYjf8tSe5zMvgzh7G9CQCuU='},
        {key: 'e4d041ce-6971-41f9-92ba-efc29c4efbf2', secret: 'NcWbxRNtqouDt2BYgcEo1iki5P0tBryWYspv23MwUPo='},
        {key: 'da7c2e3b-e3a5-48fc-9efa-9e7fd9297ebb', secret: 'kk2ewYdv5de2DMvof2v2neVyHdZ/wtpm5mHtUHdQtLQ='},
        {key: '28cfdc85-5c54-496e-b709-1744e67eb89a', secret: '1HL4l97nuQK+iyutG+Au270DacanUygWvEW1MLeTy3E='},
        {key: 'af070043-806d-4e31-b5a8-5f74aebe4231', secret: 'PJdN3gryaY8DNaI2IPPlqlkh/KmEWY6oJCanNUF6tWQ='},
    ]
}];

function randomDistID(len) {
    let id = "";
    for (let i = 0; i < len; i++) id += String.fromCharCode(65 + Math.floor(Math.random() * 26));
    return id;
}

function randomMatchesEntries() {
    let matches = [];
    for (let i = 0; i <= Math.floor(Math.random() * 5) + 1; i++) {
        matches.push({
            "distributorId": randomDistID(5), // random 5 letter string
            "paymentType": "APPLE_PAY|GOOGLE_PAY|CREDIT_CARD"
        });
    }
    return matches;
}

async function deleteAll(db, items, key) {
    let promises = items.map(item => {
        let keyParam = {};
        if (key instanceof Array) {
            key.forEach(k => {
                keyParam[k] = item[k];
            });
        } else {
            keyParam[key] = item[key];
        }
        return db.client.delete({
            TableName: db.tableName,
            Key: keyParam
        }).promise();
    });
    return Promise.all(promises).catch(err => {
        console.error('An error occurred while deleting items:', err.message);
        throw err;
    });
}

async function fetchAll(db) {
    let existingContents = [];
    try {
        let params = {TableName: db.tableName};
        let dbResult;
        do {
            dbResult = await db.client.scan(params).promise();
            existingContents.push(...dbResult.Items);
            params.ExclusiveStartKey = dbResult.LastEvaluatedKey;
        } while (typeof dbResult.LastEvaluatedKey !== "undefined");
        return existingContents;
    } catch (err) {
        console.error("Error scanning existing table items:", err.message);
        throw err;
    }
}


exports.testingHandler = async (event)  => {
    if (event.httpMethod !== 'GET') {
        const e = new Error(`This function only accepts GET requests.`);
        return jsonResponse(e, null, e.message);
    }
    console.log('received:', JSON.stringify(event));
    const action = event.queryStringParameters?.action;
    if (action !== 'initdb' && action !== 'scandb') {
        const e = new Error("No valid action specified.");
        return jsonResponse(e, null, e.message);
    }

    let dbContent;
    try {
        dbContent = await fetchAll(db);
    } catch (err) {
        console.error("An error occurred while fetching all table values:", err.message);
        return jsonResponse(err, null, "An error occurred while fetching all table values.");
    }
    if (action === "initdb") {
        return initTable(db, dbContent)
    } else if (action === "scandb") {
        return jsonResponse(null, dbContent, `Retrieved ${dbContent.length} entries.`)
    }
}

async function initTable(db, existingContents) {
    // clear existing data
    try {
        await deleteAll(db, existingContents, ["dataAccountId", "sk"]);
    } catch (err) {
        console.error("An error occurred while clearing existing table values:", err.message);
        return jsonResponse(err, null, "An error occurred while clearing existing table values.");
    }

    // generate new data (one entry for each merchantID/key/secret combo with random other values)
    let items = [];
    initialValues.forEach((merchant) => {
        merchant.keys.forEach((kp) => {
            items.push({
                PutRequest: {
                    Item: {
                        dataAccountId: Math.floor(Math.random() * 100).toString(), // random acct id 0-199
                        sk: uuidv4(), // unique sort key
                        active: true,
                        matches: randomMatchesEntries(), // 1-5 random distributor ids
                        processorData: {
                            "authenticationType": "http_signature",
                            "externalAccount": merchant.merchantID,
                            "key": kp.key,
                            "name": "cybersource",
                            "paymodeCodes": "[\"V\",\"MC\",\"AMEX\", \"D\"]",
                            "runEnvironment": "apitest.cybersource.com",
                            "secret": kp.secret
                        }
                    },
                },
            });
        });
    });

    // insert new data
    try {
        await db.client.batchWrite({RequestItems: {[db.tableName]: items}}).promise();
        console.log(`Successfully generated ${items.length} entries.`)
        return jsonResponse(null, null,  `Successfully generated ${items.length} clients.`);
    } catch (err) {
        console.log("Error inserting new db items:", err.message);
        return jsonResponse(err, null, "Error inserting new database items.");
    }
}
