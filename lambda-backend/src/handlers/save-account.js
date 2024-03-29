'use strict';

const cybersourceRestApi= require('cybersource-rest-client');
const paymentApiConfig = require('../paymentApiConfig')
const paymentRequest = require('../paymentRequest')
const jsonResponse = require('../jsonResponse')
const db = require('../db')
const { v4: uuidv4 } = require('uuid');

// keys to check input for; only add those that are required in ALL cases. sk and secret checked elsewhere.
const configRequiredKeys = ["dataAccountId", "matches", "processorData"];
const processorDataRequiredKeys = ["externalAccount", "authenticationType", "runEnvironment", "key"]


exports.saveAccountHandler = async (event) => {
    if (event.httpMethod !== 'POST') {
        throw new Error(`This function only accepts POST requests.`);
    }
    console.log('received:', JSON.stringify(event));
    let { accountData, paymentData } = JSON.parse(event.body);

    // make sure all required properties are present
    configRequiredKeys.forEach(e => {
        if (!(e in accountData)) {
            return jsonResponse({}, null, "Error: missing required configuration " + e)
        }
    })
    processorDataRequiredKeys.forEach(e => {
        if (!(e in accountData.processorData)) {
            return jsonResponse({}, null, "Error: missing required processor data key " + e)
        }
    })

    if (!(accountData.processorData.secret || accountData.sk)) {
        return jsonResponse({}, null, "Error: secret is empty, but no sort key provided to find existing.")
    }

    // if secret is blank, we need to reuse the old one
    if (!accountData.processorData.secret) {
        try {
            // try to get the existing config
            let old = await db.getItemByKey(db,
                {dataAccountId: accountData.dataAccountId, sk: accountData.sk,});
            if (old.processorData.secret) {
                // found, add it to the input
                accountData.processorData.secret = old.processorData.secret
            } else {
                // account found but missing secret (this shouldn't happen)
                throw new Error("Secret not provided and no existing secret found in the database.")
            }
            if (old.processorData.key !== accountData.processorData.key) {
                // can't reuse the same secret if id changed, throw error
                throw new Error("Attempted to update key ID without updating key secret.")
            }
            if (old.processorData.externalAccount !== accountData.processorData.externalAccount) {
                // if merchant id changed, the key pair MUST be updated as well; CS does not support merchant id changes
                throw new Error("Attempted to change merchant id without updating key/secret")
            }
        } catch (err) {
            return jsonResponse(err, null,
                (err instanceof db.DBError ?
                "No secret provided and could not retrieve existing config: "
                : "Invalid configuration: ")
                + err.message);
        }
    } else { // if new secret was provided, validation is required
        // configure CS API call parameters
        const cs_client = new cybersourceRestApi.ApiClient();
        const cs_config = new paymentApiConfig(accountData.processorData.key, accountData.processorData.secret, accountData.processorData);
        const cs_request = new paymentRequest();
        let txid = "";

        // make auth call
        try {
            const csResponse = await testTx(cs_config, cs_request, cs_client);
            console.log('csResponse:', csResponse);
            txid = csResponse.data['id'];
        } catch (err) {
            return jsonResponse(err, null, "Error: failed to authorize transaction.");
        }

        // make reversal call
        if (txid) {
            try {
                const csResponse = await testTx(cs_config, cs_request, cs_client, txid);
                console.log('csResponse:', csResponse);
            } catch (err) {
                return jsonResponse(err, null, `Error: failed to reverse transaction (ID: ${txid}).`);
            }
        }
    }

    // generate sk if needed
    if (!accountData.sk) accountData.sk = uuidv4()

    // insert or update entry
    try {
        await db.client.put({ TableName: db.tableName, Item: accountData }).promise()
    } catch (err) {
        return jsonResponse(err, null, "Failed to update database after validation: " + err.message);
    }
    return jsonResponse(null, null, "Configuration updated successfully.");
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

