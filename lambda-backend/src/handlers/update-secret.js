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
    let oldEntry;
    try {
        oldEntry = await getItemByKey(db, {dataAccountId: dataAcctID, sk: sk,});
    } catch (err) {
        console.error("DB lookup failed:", err.message);
        return jsonResponse(err, null, "Error retrieving item by key.");
    }

    // Create new matches array with the distributor IDs we need to update (may or may not be all of the entry)
    let newMatches = [];
    try {
        newMatches = buildNewMatches(oldEntry, distID instanceof Array ? distID : [distID]);
    } catch (err) {
        console.error(err.message);
        return jsonResponse(err, null, "Error validating the distributor IDs to update.");
    }

    // configure CS API call parameters
    const cs_client = new cybersourceRestApi.ApiClient();
    const cs_config = new paymentApiConfig(key, secret, oldEntry.processorData);
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
        if (oldEntry.matches.length === newMatches.length) {
            // when updating all distributors using this client, just update the existing entry
            await db.client.update({
                TableName: db.tableName,
                Key: {
                    sk: sk,
                    dataAccountId: dataAcctID,
                },
                UpdateExpression: "SET #processorData.#secret = :s, #processorData.#key = :k",
                ExpressionAttributeNames: {
                    "#processorData": "processorData",
                    "#secret": "secret",
                    "#key": "key",
                },
                ExpressionAttributeValues: {
                    ":s": secret,
                    ":k": key,
                },
            }).promise();
        } else {
            // otherwise, when updating one or more but not all, add new entry with those dist ids and new key/secret,
            // sort key, but duplicate everything else
            let  newEntry = {}
            Object.assign(newEntry, oldEntry); // deep copies oldEntry into newEntry
            newEntry.matches = newMatches;
            newEntry.processorData.secret = secret;
            newEntry.processorData.key = key;
            newEntry.sk = uuidv4();
            await db.client.put({
                TableName: db.tableName, Item: newEntry
            }).promise();

            // and remove those distributors from the other entry (everything else stays)
            await db.client.update({
                TableName: db.tableName,
                Key: {
                    sk: sk,
                    dataAccountId: dataAcctID,
                },
                UpdateExpression: `set matches = :withoutUpdated`,
                ExpressionAttributeValues: {
                    ":withoutUpdated": oldEntry.matches.filter(x => !newMatches.includes(x)),
                },
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

function buildNewMatches(item, distributors) {
    if (item.matches instanceof Array) {
        let distributorsToUpdate = [];
        distributors.forEach((distributor) => {
            if (distributorsToUpdate.find(existing => existing.distributorId === distributor)) {
                throw new Error(`Duplicate distributor ID ${distributor} found in input.`);
            }
            const matchElem = item.matches.find(match => match.distributorId === distributor);
            if (!matchElem) {
                throw new Error(`DB entry does not contain distributor ${distributor}.`);
            }
            const duplicate = item.matches.find((match) => match.distributorId === distributor && match !== matchElem);
            if (duplicate) {
                throw new Error(`DB Integrity error: ${item.sk} contains duplicates of distributor ID ${distributor}`);
            }
            distributorsToUpdate.push(matchElem);
        });
        return distributorsToUpdate;
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

