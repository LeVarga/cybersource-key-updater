'use strict';
const dynamodb = require('aws-sdk/clients/dynamodb');

const docClient = process.env.AWS_SAM_LOCAL ?
    new dynamodb.DocumentClient({endpoint: 'http://host.docker.internal:8000'}) // use local db when running locally
    : new dynamodb.DocumentClient();
const tableName = process.env.TABLE_NAME;

var cybersourceRestApi = require('cybersource-rest-client');
var path = require('path');
var paymentApiConfig = require(path.resolve('paymentApiConfig.js'));
var paymentRequest = require(path.resolve('paymentRequest.js'));

exports.updateSecretHandler = async (event) => {
    if (event.httpMethod !== 'POST') {
        throw new Error(`postMethod only accepts POST method, you tried: ${httpMethod} method.`);
    }
    console.log('received:', JSON.stringify(event));
    const { id, secret } = JSON.parse(event.body);
    var cs_client = new cybersourceRestApi.ApiClient();
    var cs_config = new paymentApiConfig(id, secret);
    var cs_request = new paymentRequest();
    var txid = ""

    // auth
    try {
        const csResponse = await testTx(cs_config, cs_request, cs_client);
        console.log('csResponse:', csResponse);
        txid = csResponse.data['id'];
    } catch (error) {
        console.error('Error:', error);
        return error;
    }

    // reversal
    if (txid) {
        try {
            const csResponse = await testTx(cs_config, cs_request, cs_client, txid);
            console.log('csResponse:', csResponse);
            //return {statusCode: 200, body: csResponse.data.status} // remove this
        } catch (error) {
            console.error('Error:', error);
            return error;
        }
    }

    // update db
    let dbEntry = { // TODO: remove hard-coded values
        dataAccountId: "129",
        sk: "ffae73e4-9142-42f3-b10a-449fc505b490",
        active: true,
        matches: [ {
            distributorId: "LFTX",
            paymentType: "APPLE_PAY|GOOGLE_PAY|CREDIT_CARD"
        }, ],
        processorData: {
            authenticationType: "http_signature",
            externalAccount: "pacqa_08",
            key: id,
            name: "cybersource",
            paymodeCodes: "[\"V\",\"MC\",\"AMEX\", \"D\"]",
            runEnvironment: "apitest.cybersource.com",
            secret: secret,
        },
    };
    await docClient.put({TableName: tableName, Item: dbEntry}).promise(); // TODO: error handling
    return {statusCode: 200, body: "Successfully updated keys."};
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

