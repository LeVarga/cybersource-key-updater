'use strict';
const dynamodb = require('aws-sdk/clients/dynamodb');
const docClient = new dynamodb.DocumentClient();
const tableName = process.env.SAMPLE_TABLE;

var cybersourceRestApi = require('cybersource-rest-client');
var path = require('path');
var paymentApiConfig = require(path.resolve('paymentApiConfig.js'));
var paymentRequest = require(path.resolve('paymentRequest.js'));

exports.updateSecretHandler = async (event) => {
    if (event.httpMethod !== 'POST') {
        throw new Error(`postMethod only accepts POST method, you tried: ${httpMethod} method.`);
    }
    try {
        console.log('received:', JSON.stringify(event));
        const { id, secret } = JSON.parse(event.body);
        const csResponse = await cs_auth(new paymentApiConfig(id, secret), new paymentRequest);
        console.log('csResponse:', csResponse);
        return { statusCode: 200, body: JSON.stringify({ message: "Keys successfully validated" }) };
    } catch (error) {
        console.error('Error:', error);
        return { statusCode: 500, body: error };
    }
}

function cs_auth(cs_config, cs_request) {
    return new Promise((resolve, reject) => {
        try {
            var apiClient = new cybersourceRestApi.ApiClient();
            var instance = new cybersourceRestApi.PaymentsApi(cs_config, apiClient);

            instance.createPayment(cs_request, function (error, data, response) {
                if (error) {
                    console.log('\nError : ' + JSON.stringify(error));
                    reject(error);
                } else {
                    console.log('\nData : ' + JSON.stringify(data));
                    console.log('\nResponse : ' + JSON.stringify(response));
                    console.log('\nResponse Code of Process a Payment : ' + JSON.stringify(response['status']));
                    resolve({error, data, response});
                }
            });
        } catch (error) {
            console.log('\nException on calling the API : ' + error);
            reject(error);
        }
    });
}

