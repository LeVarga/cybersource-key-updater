'use strict';
const dynamodb = require('aws-sdk/clients/dynamodb');

const docClient = process.env.AWS_SAM_LOCAL ?
    new dynamodb.DocumentClient({endpoint: 'http://host.docker.internal:8000'}) // use local db when running locally
    : new dynamodb.DocumentClient();
const tableName = process.env.TABLE_NAME;
const { v4: uuidv4 } = require('uuid');

var cybersourceRestApi = require('cybersource-rest-client');
var path = require('path');
var paymentApiConfig = require(path.resolve('paymentApiConfig.js'));
var paymentRequest = require(path.resolve('paymentRequest.js'));


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
    let respHeaders = {
        'Content-Type':'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
    }

    // auth
    try {
        const csResponse = await testTx(cs_config, cs_request, cs_client);
        console.log('csResponse:', csResponse);
        txid = csResponse.data['id'];
    } catch (error) {
        console.error('Error:', error);
        return {statusCode: 400, headers: respHeaders, body: JSON.stringify({error: error})};
    }

    // reversal
    if (txid) {
        try {
            const csResponse = await testTx(cs_config, cs_request, cs_client, txid);
            console.log('csResponse:', csResponse);
        } catch (error) {
            console.error('Error:', error);
            return {statusCode: 400, headers: respHeaders, body: JSON.stringify({error: error})};
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
    await docClient.put({TableName: tableName, Item: dbEntry}).promise(); // TODO: error handling
    return {statusCode: 200, headers: respHeaders, body: JSON.stringify({message: "Successfully updated keys."})};
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

