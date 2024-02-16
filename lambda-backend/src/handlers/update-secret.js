'use strict';

const cybersourceRestApi= require('cybersource-rest-client');
const paymentApiConfig = require('../paymentApiConfig')
const paymentRequest = require('../paymentRequest')
const jsonResponse = require('../jsonResponse')
const db = require('../db')
const { v4: uuidv4 } = require('uuid');


exports.updateSecretHandler = async (event) => {
    if (event.httpMethod !== 'POST') {
        throw new Error(`Only accepting POST.`);
    }
    console.log('received:', JSON.stringify(event));
    const { key, secret, dataAcctID, distID } = JSON.parse(event.body);
    const merchantID = 'pacqa_08';

    var cs_client = new cybersourceRestApi.ApiClient();
    var cs_config = new paymentApiConfig(key, secret, merchantID);
    var cs_request = new paymentRequest();
    var txid = ""

    // auth
    try {
        const csResponse = await testTx(cs_config, cs_request, cs_client);
        console.log('csResponse:', csResponse);
        txid = csResponse.data['id'];
    } catch (error) {
        console.error('Error:', error);
        return jsonResponse(error, null, "Failed to authorize transaction.")
    }

    // reversal
    if (txid) {
        try {
            const csResponse = await testTx(cs_config, cs_request, cs_client, txid);
            console.log('csResponse:', csResponse);
        } catch (error) {
            console.error('Error:', error);
            return jsonResponse(error, null, `Failed to reverse transaction (ID: ${txid}).`)
        }
    }


    // TODO: If there is already an entry with the same acct id, set active in that entry to false?
    // update db
    let dbEntry = {
        dataAccountId: dataAcctID,
        sk: uuidv4(),
        active: true,
        matches: [ {
            distributorId: distID,
            paymentType: "APPLE_PAY|GOOGLE_PAY|CREDIT_CARD"
        }, ],
        processorData: {
            authenticationType: "http_signature",
            externalAccount: merchantID,
            key: key,
            name: "cybersource",
            paymodeCodes: "[\"V\",\"MC\",\"AMEX\", \"D\"]",
            runEnvironment: "apitest.cybersource.com",
            secret: secret,
        },
    };
    await db.client.put({TableName: db.tableName, Item: dbEntry}).promise(); // TODO: error handling
    return jsonResponse(null, null, "Successfully updated keys.")
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

