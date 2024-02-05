'use strict';
const dynamodb = require('aws-sdk/clients/dynamodb');
const docClient = new dynamodb.DocumentClient();
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
            return {statusCode: 200, body: csResponse.data.status} // remove this
        } catch (error) {
            console.error('Error:', error);
            return error;
        }
    }

    // update db here (getting this far means auth and reversal were successful)

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

