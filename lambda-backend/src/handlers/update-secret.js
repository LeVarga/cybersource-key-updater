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
        console.log("Error retrieving item: ", err.message);
        return jsonResponse(err, null, "Could not retrieve item with that key.");
    }

    // get the distributor id's index in the matches array of the db entry
    let distIndex;
    try {
        distIndex = getDistributorMatchIndex(item, distID);
    } catch (err) {
        console.error(err.message);
        return jsonResponse(err, null, err.message);
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
    } catch (error) {
        console.error('Error:', error);
        return jsonResponse(error, null, "Failed to authorize transaction.");
    }

    // make reversal call
    if (txid) {
        try {
            const csResponse = await testTx(cs_config, cs_request, cs_client, txid);
            console.log('csResponse:', csResponse);
        } catch (error) {
            console.error('Error:', error);
            return jsonResponse(error, null, `Failed to reverse transaction (ID: ${txid}).`);
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
            //const updateExpression = `REMOVE matches[${distIndex}]`;
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
        console.log("Failed to update database after testing key:", err.message);
        return jsonResponse(err, null, "Failed to update database after testing key:");
    }
    return jsonResponse(null, null, "Successfully updated keys.")
}

async function getItemByKey(db, key) {
    try {
        let dbResponse = await db.client.get({TableName: db.tableName, Key: key}).promise();
        return Promise.resolve(dbResponse.Item);
    } catch (err) {
        console.log("DB lookup failed:", err.message);
        return Promise.reject(err);
    }
}

function getDistributorMatchIndex(item, distributor) {
    if (item.matches instanceof Array) {
        const matchIndex = item.matches.findIndex(match => match.distributorId === distributor);
        if (matchIndex === -1) {
            throw new Error("DB entry does not contain the provided distributor ID.");
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


function testTx(cs_config, cs_request, cs_client, reverseTxId="") {
    return new Promise((resolve, reject) => {
        function callback(error, data, response) {
            if (error) {
                console.log('\nError : ' + JSON.stringify(error));
                reject(error);
            } else {
                console.log('\nData : ' + JSON.stringify(data));
                console.log('\nResponse : ' + JSON.stringify(response));
                resolve({error, data, response});
            }
        }
        try {
            if (reverseTxId) {
                let instance = new cybersourceRestApi.ReversalApi(cs_config, cs_client);
                instance.authReversal(reverseTxId, cs_request, callback);
            } else {
                let instance = new cybersourceRestApi.PaymentsApi(cs_config, cs_client);
                instance.createPayment(cs_request, callback);
            }
        } catch (error) {
            console.log('\nException on calling the API for auth : ' + error);
            reject(error);
        }
    });
}

