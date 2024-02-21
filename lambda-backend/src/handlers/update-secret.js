'use strict';

const cybersourceRestApi= require('cybersource-rest-client');
const paymentApiConfig = require('../paymentApiConfig')
const paymentRequest = require('../paymentRequest')
const jsonResponse = require('../jsonResponse')
const db = require('../db')
const { v4: uuidv4 } = require('uuid');


exports.updateSecretHandler = async (event) => {
    if (event.httpMethod !== 'POST') {
        throw new Error(`This function only accepts POST requests.`);
    }
    console.log('received:', JSON.stringify(event));
    const { key, secret, dataAcctID, distID, sk } = JSON.parse(event.body);

    // get the appropriate db entry
    let item;
    try {
        item = await getItemByKey(db, {dataAccountId: dataAcctID, sk: sk,});
    } catch (err) {
        console.error("DB lookup failed:", err.message);
        return jsonResponse(err, null, "Error retrieving item by key.");
    }

    // get the distributor id's index in the matches array of the db entry
    let distIndex;
    try {
        distIndex = getDistributorMatchIndex(item, distID);
    } catch (err) {
        console.error(err.message);
        return jsonResponse(err, null, "Error finding match in table item.");
    }

    // configure CS API call parameters
    const cs_client = new cybersourceRestApi.ApiClient();
    const cs_config = new paymentApiConfig(key, secret, item.processorData);
    const cs_request = new paymentRequest();
    let txid = "";

    // make auth call
    try {
        const csResponse = await testTx(cs_config, cs_request, cs_client);
        console.log('csResponse:', csResponse);
        txid = csResponse.data['id'];
    } catch (err) {
        console.error('Failed to authorize transaction: ', err);
        return jsonResponse(err, null, "Error: failed to authorize transaction.");
    }

    // make reversal call
    if (txid) {
        try {
            const csResponse = await testTx(cs_config, cs_request, cs_client, txid);
            console.log('csResponse:', csResponse);
        } catch (err) {
            console.error('Failed to reverse transaction:', err);
            return jsonResponse(err, null, `Error: failed to reverse transaction (ID: ${txid}).`);
        }
    }


    // update db
    try {
        if (item.matches.length === 1) {
            // when this is already the only dist id using the key, update existing entry only
            await db.client.update({
                TableName: db.tableName,
                Key: {
                    sk: sk,
                    dataAccountId: dataAcctID,
                },
                UpdateExpression: "set #secret = :s, #key = :k",
                ExpressionAttributeNames: {
                    "#key": "key",
                    "#secret": "secret",
                },
                ExpressionAttributeValues: {
                    ":s": secret,
                    ":k": key,
                },
            }).promise();
        } else {
            // otherwise create new entry with that dist id and new key/secret and sort key, but everything else same
            let  newEntry = {}
            Object.assign(newEntry, item);
            newEntry.matches = [item.matches[distIndex]];
            newEntry.processorData.secret = secret;
            newEntry.processorData.key = key;
            newEntry.sk = uuidv4();
            await db.client.put({
                TableName: db.tableName, Item: newEntry
            }).promise();

            // and remove the distributor from its original entry
            await db.client.update({
                TableName: db.tableName,
                Key: {
                    sk: sk,
                    dataAccountId: dataAcctID,
                },
                UpdateExpression: `REMOVE matches[${distIndex}]`,
            }).promise();
        }
    } catch (err) {
        console.error("Failed to update database after testing key:", err.message);
        return jsonResponse(err, null, "Failed to update database after testing key.");
    }
    // TODO: return the new db entry in the data field?
    return jsonResponse(null, null, "Successfully updated keys.");
}

async function getItemByKey(db, key) {
    let dbResponse = await db.client.get({TableName: db.tableName, Key: key}).promise();
    if (dbResponse.Item) {
        return dbResponse.Item;
    }
    throw new Error("Could not find db item with these keys.");
}

function getDistributorMatchIndex(item, distributor) {
    if (item.matches instanceof Array) {
        const matchIndex = item.matches.findIndex(match => match.distributorId === distributor);
        if (matchIndex === -1) {
            throw new Error(`DB entry does not contain distributor {${distributor}.`);
        }
        const duplicateIndex = item.matches.findIndex((match, index) => match.distributorId === distributor && index !== matchIndex);
        if (duplicateIndex !== -1) {
            throw new Error("Database error: found duplicate distributor IDs in entry.");
        }
        return matchIndex;
    } else {
        throw new Error("No matches array found in DB entry.");
    }
}


async function testTx(cs_config, cs_request, cs_client, reverseTxId="") {
    return new Promise((resolve, reject) => {
        function callback(error, data, response) {
            if (error) {
                reject(error);
            } else {
                resolve({data, response});
            }
        }

        if (reverseTxId) {
            let instance = new cybersourceRestApi.ReversalApi(cs_config, cs_client);
            instance.authReversal(reverseTxId, cs_request, callback);
        } else {
            let instance = new cybersourceRestApi.PaymentsApi(cs_config, cs_client);
            instance.createPayment(cs_request, callback);
        }
    });
}

